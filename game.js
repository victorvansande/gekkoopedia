  (function(){
    const canvas = document.getElementById('game-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const GROUND = 44, GAP = 152, PW = 58, SPACING = 210;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Veilige opslag: localStorage (op Netlify), valt terug op geheugen (in preview)
    const store = (() => {
      let mem = {}, ok = false;
      try { localStorage.setItem('__gk__','1'); localStorage.removeItem('__gk__'); ok = true; } catch(e){}
      return {
        get(k){ try { return ok ? localStorage.getItem(k) : (k in mem ? mem[k] : null); } catch(e){ return (k in mem) ? mem[k] : null; } },
        set(k,v){ try { if(ok) localStorage.setItem(k,v); else mem[k]=v; } catch(e){ mem[k]=v; } }
      };
    })();
    const SCORES_KEY = 'gekkoo_scores', BEST_KEY = 'gekkoo_best';
    const loadBest = () => parseInt(store.get(BEST_KEY)||'0',10) || 0;
    const loadScores = () => { try { return JSON.parse(store.get(SCORES_KEY)||'[]'); } catch(e){ return []; } };
    const saveScores = (a) => store.set(SCORES_KEY, JSON.stringify(a));
    const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    // Gecachte lucht-gradient (W/H zijn constant)
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0,'#bfe8fb');
    skyGrad.addColorStop(0.55,'#dff1f7');
    skyGrad.addColorStop(1,'#eef9f0');

    // Wolken (ambient achtergrond)
    const clouds = [
      {x: 70,  y: 86,  s: 1.0, v: 0.22},
      {x: 230, y: 132, s: 0.78, v: 0.16},
      {x: 320, y: 60,  s: 0.6,  v: 0.30}
    ];

    let bird, pipes, score, best, speed, running, state; // state: idle | play | dead
    let particles, groundX, scorePop, passedCount;

    function reset(){
      bird = {x:80, y:H/2, vy:0, r:15};
      pipes = [];
      particles = [];
      score = 0;
      speed = 2.3;
      groundX = 0;
      scorePop = 0;
      passedCount = 0;
    }

    function spawnPipe(x){
      const minTop = 54, maxTop = H - GROUND - GAP - 54;
      pipes.push({
        x:x,
        top: minTop + Math.random()*(maxTop-minTop),
        passed:false,
        star: Math.random() < 0.55 ? {got:false} : null
      });
    }

    /* ---- Deeltjes ---- */
    function spawnPuff(x,y){
      if(reduceMotion) return;
      for(let i=0;i<5;i++){
        particles.push({x:x-6, y:y+4, vx:-(0.5+Math.random()*1.3), vy:(Math.random()*1-0.3),
          life:22, max:22, kind:'puff', size:4+Math.random()*4});
      }
    }
    function spawnSpark(x,y){
      if(reduceMotion) return;
      for(let i=0;i<10;i++){
        const a=Math.PI*2*i/10, sp=1.4+Math.random()*1.6;
        particles.push({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
          life:26, max:26, kind:'spark', col:'#FFCC33', size:2.5+Math.random()*2});
      }
    }
    function spawnBurst(x,y){
      if(reduceMotion) return;
      const cols=['#FFCC33','#003399','#479554','#FF99CC','#FF3333','#ffffff'];
      for(let i=0;i<20;i++){
        const a=Math.random()*Math.PI*2, sp=2+Math.random()*3.6;
        particles.push({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-1,
          life:44, max:44, kind:'burst', col:cols[i%cols.length], size:5+Math.random()*4,
          rot:Math.random()*6, vr:(Math.random()-0.5)*0.4});
      }
    }
    function updateParticles(){
      for(const p of particles){
        p.x+=p.vx; p.y+=p.vy;
        if(p.kind==='burst'){ p.vy+=0.18; p.rot+=p.vr; }
        else if(p.kind==='puff'){ p.size*=1.04; }
        p.life--;
      }
      particles = particles.filter(p=>p.life>0);
    }
    function drawParticles(){
      for(const p of particles){
        const a = Math.max(0, p.life/p.max);
        ctx.globalAlpha = a;
        if(p.kind==='puff'){
          ctx.fillStyle='rgba(255,255,255,0.85)';
          ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
        } else if(p.kind==='spark'){
          ctx.fillStyle=p.col;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
        } else {
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
          ctx.fillStyle=p.col; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }

    function flap(){
      if(state === 'idle'){ startGame(); return; }
      if(state === 'play'){ bird.vy = -6.8; spawnPuff(bird.x, bird.y); }
    }

    function startGame(){
      reset();
      state = 'play';
      document.getElementById('game-start').hidden = true;
      document.getElementById('game-over').hidden = true;
      if(!running){ running = true; requestAnimationFrame(loop); }
    }

    function resetToIdle(){
      running = false;
      state = 'idle';
      document.getElementById('game-over').hidden = true;
      document.getElementById('game-start').hidden = false;
      reset();
      draw();
    }
    onLeaveSpel = resetToIdle; // gekoppeld aan showView: pauzeer bij verlaten

    function update(){
      bird.vy += 0.45;
      bird.y += bird.vy;
      for(const p of pipes) p.x -= speed;
      groundX = (groundX - speed) % 24;
      if(pipes.length === 0 || pipes[pipes.length-1].x < W - SPACING) spawnPipe(W + 10);
      while(pipes.length && pipes[0].x + PW < 0) pipes.shift();

      for(const p of pipes){
        if(!p.passed && p.x + PW < bird.x){
          p.passed = true; score++; passedCount++; scorePop = 1;
          if(passedCount % 5 === 0) speed = Math.min(speed + 0.2, 5);
        }
        // bonus-ster oppikken
        if(p.star && !p.star.got){
          const sx=p.x+PW/2, sy=p.top+GAP/2, dx=bird.x-sx, dy=bird.y-sy;
          if(dx*dx+dy*dy < (bird.r+13)*(bird.r+13)){
            p.star.got = true; score += 2; scorePop = 1; spawnSpark(sx,sy);
          }
        }
        if(bird.x + bird.r > p.x && bird.x - bird.r < p.x + PW){
          if(bird.y - bird.r < p.top || bird.y + bird.r > p.top + GAP){ die(); return; }
        }
      }
      scorePop *= 0.86;
      if(bird.y + bird.r > H - GROUND){ bird.y = H - GROUND - bird.r; die(); return; }
      if(bird.y - bird.r < 0){ bird.y = bird.r; bird.vy = 0; }
    }

    /* ---- Teken-helpers ---- */
    function rr(x,y,w,h,r){
      r = Math.min(r, Math.abs(w)/2, Math.abs(h)/2);
      ctx.beginPath();
      ctx.moveTo(x+r,y);
      ctx.arcTo(x+w,y,x+w,y+h,r);
      ctx.arcTo(x+w,y+h,x,y+h,r);
      ctx.arcTo(x,y+h,x,y,r);
      ctx.arcTo(x,y,x+w,y,r);
      ctx.closePath();
    }
    function drawCloud(x,y,s){
      ctx.beginPath();
      ctx.arc(x, y, 14*s, 0, Math.PI*2);
      ctx.arc(x+16*s, y+4*s, 18*s, 0, Math.PI*2);
      ctx.arc(x+34*s, y, 13*s, 0, Math.PI*2);
      ctx.arc(x+16*s, y-7*s, 13*s, 0, Math.PI*2);
      ctx.fill();
    }
    function pipeBody(px,py,pw,ph){
      const g = ctx.createLinearGradient(px,0,px+pw,0);
      g.addColorStop(0,'#2a5fd0');
      g.addColorStop(0.22,'#1a4fc0');
      g.addColorStop(0.55,'#003399');
      g.addColorStop(1,'#002b80');
      ctx.fillStyle = g;
      rr(px,py,pw,ph,9); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      rr(px+7, py+9, 6, ph-18, 3); ctx.fill();
    }
    function pipeCap(px,capY,pw){
      const g = ctx.createLinearGradient(0,capY,0,capY+18);
      g.addColorStop(0,'#FFDA6E');
      g.addColorStop(1,'#FFB81F');
      ctx.fillStyle = g;
      rr(px-4, capY, pw+8, 18, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      rr(px-1, capY+3, pw+2, 4, 2); ctx.fill();
    }

    function drawBackground(){
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0,0,W,H);

      // zon met zachte gloed
      const sunG = ctx.createRadialGradient(W-50,56,4,W-50,56,48);
      sunG.addColorStop(0,'rgba(255,228,153,0.95)');
      sunG.addColorStop(1,'rgba(255,204,51,0)');
      ctx.fillStyle = sunG;
      ctx.beginPath(); ctx.arc(W-50,56,48,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FFCC33';
      ctx.beginPath(); ctx.arc(W-50,56,19,0,Math.PI*2); ctx.fill();

      // wolken
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      for(const c of clouds) drawCloud(c.x, c.y, c.s);

      // glooiende heuvels achter de buizen
      ctx.fillStyle = '#cfead0';
      ctx.beginPath(); ctx.arc(60, H-GROUND+8, 78, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(220, H-GROUND+14, 96, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#bfe2c1';
      ctx.beginPath(); ctx.arc(150, H-GROUND+18, 70, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(320, H-GROUND+10, 70, Math.PI, 0); ctx.fill();
    }

    function drawGround(){
      ctx.fillStyle = '#4fae5f';
      ctx.fillRect(0, H-GROUND, W, GROUND);
      ctx.fillStyle = '#3c814a';
      ctx.fillRect(0, H-GROUND, W, 7);
      // scrollende graspuntjes
      ctx.fillStyle = '#43964f';
      for(let gx=groundX; gx<W+12; gx+=24){
        ctx.beginPath();
        ctx.moveTo(gx, H-GROUND+7);
        ctx.lineTo(gx+12, H-GROUND+7);
        ctx.lineTo(gx+6, H-GROUND+15);
        ctx.closePath(); ctx.fill();
      }
    }

    function drawGecko(){
      const rot = state==='play'
        ? Math.max(-0.5, Math.min(1.0, bird.vy/12))
        : (reduceMotion ? 0 : Math.sin(Date.now()/320)*0.12);
      ctx.save();
      ctx.translate(bird.x, bird.y);
      // schaduw-gloed zodat de gekko op elke achtergrond leesbaar blijft
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(0,0,bird.r+6,0,Math.PI*2); ctx.fill();
      ctx.rotate(rot);
      ctx.font = '30px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🦎', 0, 1);
      ctx.restore();
    }

    function draw(){
      drawBackground();

      for(const p of pipes){
        const topH = p.top, gapY = p.top + GAP, botH = H - GROUND - gapY;
        pipeBody(p.x, -12, PW, topH+12);
        pipeCap(p.x, topH-18, PW);
        pipeBody(p.x, gapY, PW, botH+12);
        pipeCap(p.x, gapY, PW);
      }

      // bonus-sterren
      for(const p of pipes){
        if(p.star && !p.star.got){
          const sx=p.x+PW/2, sy=p.top+GAP/2;
          const pulse = reduceMotion ? 1 : 1 + Math.sin(Date.now()/200 + p.x)*0.12;
          ctx.save();
          ctx.translate(sx,sy); ctx.scale(pulse,pulse);
          ctx.font='24px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('⭐',0,0);
          ctx.restore();
        }
      }

      drawGround();
      drawParticles();
      drawGecko();

      if(state === 'play'){
        const sc = 1 + Math.max(0,scorePop)*0.55;
        ctx.save();
        ctx.translate(W/2, 42);
        ctx.scale(sc, sc);
        ctx.font = 'bold 40px Fredoka, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 6; ctx.strokeStyle = '#003399';
        ctx.strokeText(score, 0, 0);
        ctx.fillStyle = '#fff';
        ctx.fillText(score, 0, 0);
        ctx.restore();
      }
    }

    function loop(){
      if(state !== 'play'){ running = false; return; }
      if(!document.getElementById('module-spel').classList.contains('active')){ resetToIdle(); return; }
      // wolken laten zweven tijdens het spel
      for(const c of clouds){ c.x -= c.v; if(c.x < -70){ c.x = W+50; c.y = 46+Math.random()*120; } }
      update();
      if(state === 'play'){ updateParticles(); draw(); requestAnimationFrame(loop); }
    }

    function die(){
      if(state === 'dead') return;
      state = 'dead';
      running = false;
      spawnBurst(bird.x, bird.y);
      let frames = 0;
      function deathLoop(){
        if(!document.getElementById('module-spel').classList.contains('active')){ resetToIdle(); return; }
        updateParticles();
        draw();
        frames++;
        if(frames < 38 && !reduceMotion){ requestAnimationFrame(deathLoop); }
        else { gameOver(); }
      }
      requestAnimationFrame(deathLoop);
    }

    function gameOver(){
      best = loadBest();
      if(score > best){ best = score; store.set(BEST_KEY, String(best)); }
      document.getElementById('final-score').textContent = score;
      document.getElementById('best-score').textContent = best;

      const scores = loadScores();
      const qualifies = score > 0 && (scores.length < 5 || score > scores[scores.length-1].score);
      const ne = document.getElementById('name-entry');
      ne.hidden = !qualifies;
      if(qualifies) document.getElementById('name-input').value = '';

      document.getElementById('game-over').hidden = false;
      renderLeaderboard();
    }

    function saveScore(){
      let name = (document.getElementById('name-input').value || '').trim();
      if(!name) name = 'Anoniem';
      name = name.slice(0,12);
      const scores = loadScores();
      scores.push({name, score, t:Date.now()});
      scores.sort((a,b) => b.score - a.score || a.t - b.t);
      saveScores(scores.slice(0,5));
      document.getElementById('name-entry').hidden = true;
      renderLeaderboard(name, score);
    }

    function renderLeaderboard(hlName, hlScore){
      const list = document.getElementById('lb-list');
      const scores = loadScores();
      if(!scores.length){
        list.innerHTML = '<li class="empty">Nog geen scores, speel de eerste!</li>';
        return;
      }
      list.innerHTML = scores.map(s => {
        const you = (hlName && s.name === hlName && s.score === hlScore) ? ' you' : '';
        return `<li class="${you.trim()}"><span class="lb-name">${escapeHtml(s.name)}</span><span class="lb-score">${s.score}</span></li>`;
      }).join('');
    }

    canvas.addEventListener('mousedown', e => { e.preventDefault(); flap(); });
    canvas.addEventListener('touchstart', e => { e.preventDefault(); flap(); }, {passive:false});
    document.addEventListener('keydown', e => {
      if(e.code === 'Space' && document.getElementById('module-spel').classList.contains('active')){
        e.preventDefault(); flap();
      }
    });
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-retry').addEventListener('click', startGame);
    document.getElementById('btn-save').addEventListener('click', saveScore);
    document.getElementById('name-input').addEventListener('keydown', e => {
      if(e.key === 'Enter'){ e.preventDefault(); saveScore(); }
    });

    // Startscène tekenen achter de start-kaart
    reset();
    state = 'idle';
    draw();
    renderLeaderboard();
  })();

  /* ---- Regio-ondersteuners: codeslot + bestanden ----
