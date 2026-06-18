  /* ---- Gekkoo Tik: tik insecten weg voor ze verdwijnen ---- */
  (function(){
    const canvas = document.getElementById('tik-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const COLS = 3, ROWS = 3, HEADER = 68;
    const CELL_W = W / COLS;
    const CELL_H = (H - HEADER) / ROWS;
    const HOLE_RX = 44, HOLE_RY = 27;
    const GAME_DURATION = 30;
    const BUG_EMOJIS = ['🪲','🦗','🪰','🦟','🐝','🐛','🦋','🐞'];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // bugs: Map van "col,row" -> {em, age, maxAge, pop, in, wob}
    let bugs, particles, floats, score, timeLeft, running, state, spawnTimer, lastTs;

    // Gecachte grasachtergrond
    const grassGrad = ctx.createLinearGradient(0,0,0,H);
    grassGrad.addColorStop(0,'#cdeccd');
    grassGrad.addColorStop(1,'#b6e0bb');

    function reset(){
      bugs = new Map(); particles = []; floats = [];
      score = 0; timeLeft = GAME_DURATION;
      running = false; spawnTimer = 0; lastTs = null;
    }

    function cellCenter(c, r){
      return { cx: c*CELL_W + CELL_W/2, cy: HEADER + r*CELL_H + CELL_H/2 + 4 };
    }

    function spawnBug(){
      if(bugs.size >= 5) return;
      const empties = [];
      for(let c=0;c<COLS;c++) for(let r=0;r<ROWS;r++){
        if(!bugs.has(c+','+r)) empties.push([c,r]);
      }
      if(!empties.length) return;
      const [c,r] = empties[(Math.random()*empties.length)|0];
      bugs.set(c+','+r, {
        em: BUG_EMOJIS[(Math.random()*BUG_EMOJIS.length)|0],
        age: 0,
        maxAge: 1.3 + Math.random()*1.4,
        pop: -1,
        in: 0,
        wob: Math.random()*Math.PI*2
      });
    }

    /* ---- Deeltjes & zwevende punten ---- */
    function spawnSpark(x,y,col){
      if(reduceMotion) return;
      for(let i=0;i<11;i++){
        const a=Math.PI*2*i/11, sp=1.4+Math.random()*1.9;
        particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:24,max:24,size:2.4+Math.random()*2.2,col:col||'#FFCC33'});
      }
    }
    function spawnFloat(x,y,txt,col){ floats.push({x,y,txt,col:col||'#003399',life:34,max:34}); }
    function updateParticles(dt){
      const k = dt*60;
      for(const p of particles){ p.x+=p.vx*k; p.y+=p.vy*k; p.vy+=0.12*k; p.life-=k; }
      particles = particles.filter(p=>p.life>0);
      for(const f of floats){ f.y-=0.9*k; f.life-=k; }
      floats = floats.filter(f=>f.life>0);
    }
    function drawParticles(){
      for(const p of particles){
        ctx.globalAlpha = Math.max(0,p.life/p.max);
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='bold 22px Fredoka, sans-serif'; ctx.lineJoin='round';
      for(const f of floats){
        ctx.globalAlpha = Math.max(0,f.life/f.max);
        ctx.lineWidth=4; ctx.strokeStyle='rgba(255,255,255,.92)';
        ctx.strokeText(f.txt,f.x,f.y);
        ctx.fillStyle=f.col; ctx.fillText(f.txt,f.x,f.y);
      }
      ctx.globalAlpha = 1;
    }

    function rr(x,y,w,h,r){
      r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);
      ctx.beginPath();
      ctx.moveTo(x+r,y);
      ctx.arcTo(x+w,y,x+w,y+h,r);
      ctx.arcTo(x+w,y+h,x,y+h,r);
      ctx.arcTo(x,y+h,x,y,r);
      ctx.arcTo(x,y,x+w,y,r);
      ctx.closePath();
    }
    function easeOutBack(t){ const c1=1.70158, c3=c1+1; return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2); }

    function update(dt){
      spawnTimer += dt;
      const interval = Math.max(0.34, 1.05 - (GAME_DURATION - timeLeft)*0.02);
      if(spawnTimer >= interval){ spawnBug(); spawnTimer = 0; }

      timeLeft = Math.max(0, timeLeft - dt);
      if(timeLeft <= 0){ die(); return; }

      for(const [key,b] of bugs){
        if(b.in < 1) b.in = Math.min(1, b.in + dt/0.16);
        b.wob += dt*4;
        if(b.pop >= 0){ b.pop += dt; if(b.pop > 0.28) bugs.delete(key); }
        else {
          b.age += dt;
          if(b.age >= b.maxAge){
            const {cx,cy} = cellCenter(...key.split(',').map(Number));
            if(!reduceMotion) for(let i=0;i<5;i++) particles.push({x:cx,y:cy,vx:(Math.random()-0.5)*1.4,vy:-Math.random()*1.6,life:18,max:18,size:2+Math.random()*2,col:'rgba(150,120,80,0.8)'});
            bugs.delete(key);
          }
        }
      }
    }

    function drawHole(cx, cy){
      // soilrand met lichte bovenkant voor diepte
      ctx.fillStyle = '#8a6a44';
      ctx.beginPath(); ctx.ellipse(cx, cy+3, HOLE_RX+6, HOLE_RY+6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#b89466';
      ctx.beginPath(); ctx.ellipse(cx, cy, HOLE_RX+5, HOLE_RY+5, 0, 0, Math.PI*2); ctx.fill();
      // het gat (concaaf via radiale gradient)
      const g = ctx.createRadialGradient(cx, cy-3, 4, cx, cy, HOLE_RX);
      g.addColorStop(0,'#2c1d10');
      g.addColorStop(0.7,'#3d2a18');
      g.addColorStop(1,'#5a4126');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, cy, HOLE_RX, HOLE_RY, 0, 0, Math.PI*2); ctx.fill();
    }

    function drawTimerRing(cx, cy, pct){
      // kleur verloopt groen -> amber -> rood
      let col = '#479554';
      if(pct < 0.3) col = '#FF3333';
      else if(pct < 0.6) col = '#E8A12B';
      ctx.lineWidth = 5; ctx.lineCap = 'round';
      // track
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); ctx.ellipse(cx, cy, HOLE_RX+5, HOLE_RY+5, 0, 0, Math.PI*2); ctx.stroke();
      // resterende tijd
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.ellipse(cx, cy, HOLE_RX+5, HOLE_RY+5, 0, -Math.PI/2, -Math.PI/2 + Math.PI*2*pct);
      ctx.stroke();
    }

    function drawBug(key, b){
      const [c,r] = key.split(',').map(Number);
      const {cx, cy} = cellCenter(c, r);

      if(b.pop >= 0){
        // wegtik-animatie
        const t = b.pop/0.28;
        ctx.globalAlpha = 1 - t;
        ctx.font = Math.round(38*(1 + t*0.7)) + 'px serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.em, cx, cy - t*16);
        ctx.globalAlpha = 1;
        return;
      }

      // aftelring rond het gat
      drawTimerRing(cx, cy, 1 - b.age/b.maxAge);

      // pop-in schaal + lichte wiebel
      const scale = b.in < 1 ? Math.max(0.05, easeOutBack(b.in)) : 1;
      const wob = reduceMotion ? 0 : Math.sin(b.wob)*0.06;
      const lift = (1 - (b.in<1?b.in:1)) * 10; // komt omhoog uit het gat

      // schaduw in het gat
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = '#1c1208';
      ctx.beginPath(); ctx.ellipse(cx, cy+10, 18*scale, 7*scale, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.translate(cx, cy - 4 + lift);
      ctx.rotate(wob);
      ctx.scale(scale, scale);
      ctx.font = '36px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.em, 0, 0);
      ctx.restore();
    }

    function drawHeader(){
      // balk met gradient
      const hg = ctx.createLinearGradient(0,0,0,HEADER);
      hg.addColorStop(0,'#0a3aa0');
      hg.addColorStop(1,'#003399');
      ctx.fillStyle = hg;
      rr(0, -20, W, HEADER+20, 0); ctx.fill();
      // glans bovenaan
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, 0, W, 3);

      if(state === 'play' || state === 'dead'){
        // score
        ctx.font = 'bold 21px Fredoka, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.lineJoin='round'; ctx.strokeStyle = 'rgba(0,20,70,0.55)';
        ctx.strokeText('🏆 ' + score, 14, 24);
        ctx.fillStyle = '#fff'; ctx.fillText('🏆 ' + score, 14, 24);

        // tijd
        ctx.textAlign = 'right';
        ctx.font = 'bold 17px Fredoka, sans-serif';
        ctx.fillStyle = timeLeft <= 5 ? '#ffd23f' : '#dfe8ff';
        ctx.fillText('⏱️ ' + Math.ceil(timeLeft) + 's', W - 14, 24);

        // tijdsbalk onderaan de header (afgerond, gradient, pulse bij weinig tijd)
        const pct = timeLeft / GAME_DURATION;
        const bx = 14, bw = W - 28, by = HEADER - 14, bh = 7;
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        rr(bx, by, bw, bh, bh/2); ctx.fill();
        const low = pct < 0.2;
        const pulse = low && !reduceMotion ? 0.55 + 0.45*Math.abs(Math.sin(Date.now()/180)) : 1;
        const bar = ctx.createLinearGradient(bx,0,bx+bw,0);
        if(pct > 0.3){ bar.addColorStop(0,'#7bd389'); bar.addColorStop(1,'#479554'); }
        else { bar.addColorStop(0,'#ff7a5c'); bar.addColorStop(1,'#FF3333'); }
        ctx.globalAlpha = pulse;
        ctx.fillStyle = bar;
        rr(bx, by, Math.max(bh, bw*pct), bh, bh/2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function draw(){
      // gras
      ctx.fillStyle = grassGrad; ctx.fillRect(0,0,W,H);
      // subtiele grasspikkels
      ctx.fillStyle = 'rgba(60,129,74,0.10)';
      for(let i=0;i<26;i++){
        const gx = (i*53 % W), gy = HEADER + ((i*97) % (H-HEADER-10)) + 6;
        ctx.fillRect(gx, gy, 2, 5);
      }

      // alle holes (speelbord) altijd tekenen
      for(let c=0;c<COLS;c++) for(let r=0;r<ROWS;r++){
        const {cx,cy} = cellCenter(c,r);
        drawHole(cx, cy);
      }

      // bugs bovenop hun hole
      for(const [key,b] of bugs) drawBug(key, b);

      drawParticles();
      drawHeader();
    }

    function tik(clientX, clientY, rect){
      if(state !== 'play') return;
      const x = (clientX - rect.left) * (W / rect.width);
      const y = (clientY - rect.top) * (H / rect.height);
      if(y < HEADER) return;
      const c = Math.floor(x / CELL_W);
      const r = Math.floor((y - HEADER) / CELL_H);
      if(c<0||c>=COLS||r<0||r>=ROWS) return;
      const key = c+','+r;
      const b = bugs.get(key);
      if(b && b.pop < 0){
        b.pop = 0; score++;
        const {cx,cy} = cellCenter(c,r);
        spawnSpark(cx, cy, '#FFCC33');
        spawnFloat(cx, cy-18, '+1', '#003399');
      }
    }

    function die(){
      running = false; state = 'dead';
      document.getElementById('tik-final-score').textContent = score;
      document.getElementById('tik-over').hidden = false;
      draw();
    }

    function loop(ts){
      if(!running) return;
      const spel = document.getElementById('module-spel');
      const panel = document.getElementById('gpanel-tik');
      if(!spel.classList.contains('active') || (panel && panel.hidden)){ resetToIdle(); return; }
      if(lastTs === null) lastTs = ts;
      const dt = Math.min((ts - lastTs)/1000, 0.1);
      lastTs = ts;
      update(dt);
      if(running){ updateParticles(dt); draw(); requestAnimationFrame(loop); }
    }

    function startGame(){
      reset(); state = 'play';
      document.getElementById('tik-start').hidden = true;
      document.getElementById('tik-over').hidden = true;
      running = true;
      requestAnimationFrame(ts => { lastTs = ts; loop(ts); });
    }

    function resetToIdle(){
      running = false; state = 'idle';
      document.getElementById('tik-over').hidden = true;
      document.getElementById('tik-start').hidden = false;
      reset(); draw();
    }

    canvas.addEventListener('click', e => {
      tik(e.clientX, e.clientY, canvas.getBoundingClientRect());
    });
    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      tik(t.clientX, t.clientY, canvas.getBoundingClientRect());
    }, {passive:false});

    document.getElementById('tik-btn-start').addEventListener('click', startGame);
    document.getElementById('tik-btn-retry').addEventListener('click', startGame);

    reset(); state = 'idle'; draw();
  })();
