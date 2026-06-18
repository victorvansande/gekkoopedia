  /* ---- Gekkoo Vang: vang de vallende insecten ---- */
  (function(){
    const canvas = document.getElementById('vang-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const GROUND = 54;
    const GECKO_Y = H - GROUND + 2;
    const GECKO_R = 26, BUG_R = 15;
    const BUG_EMOJIS = ['🪲','🦗','🪰','🦟','🐝','🐛'];

    // Gecachte lucht-gradient (zelfde sfeer als Gekkoo Hop)
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0,'#bfe8fb');
    skyGrad.addColorStop(0.55,'#dff1f7');
    skyGrad.addColorStop(1,'#eef9f0');

    const clouds = [
      {x:60,  y:70,  s:0.9,  v:0.18},
      {x:240, y:116, s:0.7,  v:0.13},
      {x:320, y:52,  s:0.55, v:0.24}
    ];

    let geckoX, geckoTargetX, bugs, particles, floats,
        score, lives, running, state, spawnT, speed, tongue, lifeFlash, scorePop;

    function reset(){
      geckoX = W/2; geckoTargetX = W/2;
      bugs = []; particles = []; floats = [];
      score = 0; lives = 3; running = false;
      spawnT = 0; speed = 2.6; tongue = 0; lifeFlash = 0; scorePop = 0;
    }

    function spawnBug(){
      bugs.push({
        x: BUG_R + 10 + Math.random()*(W - BUG_R*2 - 20),
        y: -BUG_R,
        v: speed + Math.random()*1.4,
        em: BUG_EMOJIS[(Math.random()*BUG_EMOJIS.length)|0],
        rot: 0, vr: (Math.random()-0.5)*0.12,
        sway: Math.random()*Math.PI*2
      });
    }

    /* ---- Deeltjes & zwevende punten ---- */
    function spawnSpark(x,y,col){
      if(reduceMotion) return;
      for(let i=0;i<10;i++){
        const a=Math.PI*2*i/10, sp=1.3+Math.random()*1.7;
        particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:24,max:24,size:2.4+Math.random()*2,col:col||'#FFCC33'});
      }
    }
    function spawnFloat(x,y,txt,col){
      floats.push({x,y,txt,col:col||'#003399',life:36,max:36});
    }
    function updateParticles(){
      for(const p of particles){ p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.life--; }
      particles = particles.filter(p=>p.life>0);
      for(const f of floats){ f.y-=0.85; f.life--; }
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

    /* ---- Teken-helpers ---- */
    function drawCloud(x,y,s){
      ctx.beginPath();
      ctx.arc(x, y, 14*s, 0, Math.PI*2);
      ctx.arc(x+16*s, y+4*s, 18*s, 0, Math.PI*2);
      ctx.arc(x+34*s, y, 13*s, 0, Math.PI*2);
      ctx.arc(x+16*s, y-7*s, 13*s, 0, Math.PI*2);
      ctx.fill();
    }

    function setGeckoTarget(clientX, rect){
      const gx = (clientX - rect.left) * (W / rect.width);
      geckoTargetX = Math.max(GECKO_R, Math.min(W - GECKO_R, gx));
    }

    function update(){
      geckoX += (geckoTargetX - geckoX) * 0.35;
      if(tongue > 0) tongue--;
      if(lifeFlash > 0) lifeFlash--;
      scorePop *= 0.86;

      spawnT++;
      if(spawnT >= Math.max(26, 68 - score*2)){ spawnBug(); spawnT = 0; }
      speed = 2.6 + score*0.05;

      for(let i=bugs.length-1;i>=0;i--){
        const b = bugs[i];
        b.y += b.v;
        b.sway += 0.05;
        b.x += Math.sin(b.sway) * 0.4;
        b.rot += b.vr;
        const dx = b.x - geckoX, dy = b.y - (GECKO_Y - 8);
        if(dx*dx + dy*dy < (BUG_R + GECKO_R) * (BUG_R + GECKO_R)){
          score++; scorePop = 1; tongue = 9;
          spawnSpark(b.x, b.y, '#FFCC33');
          spawnFloat(b.x, b.y - 12, '+1', '#003399');
          bugs.splice(i, 1);
        } else if(b.y > H + BUG_R){
          lives--; lifeFlash = 18;
          spawnSpark(b.x, H - GROUND, '#FF6644');
          bugs.splice(i, 1);
          if(lives <= 0){ die(); return; }
        }
      }
    }

    function drawBackground(){
      ctx.fillStyle = skyGrad; ctx.fillRect(0,0,W,H);

      // zon met zachte gloed
      const sunG = ctx.createRadialGradient(W-46,52,4,W-46,52,46);
      sunG.addColorStop(0,'rgba(255,228,153,0.95)');
      sunG.addColorStop(1,'rgba(255,204,51,0)');
      ctx.fillStyle = sunG;
      ctx.beginPath(); ctx.arc(W-46,52,46,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FFCC33';
      ctx.beginPath(); ctx.arc(W-46,52,17,0,Math.PI*2); ctx.fill();

      // wolken
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      for(const c of clouds) drawCloud(c.x, c.y, c.s);

      // glooiende heuvels
      ctx.fillStyle = '#cfead0';
      ctx.beginPath(); ctx.arc(70,  H-GROUND+10, 80, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(250, H-GROUND+16, 96, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#bfe2c1';
      ctx.beginPath(); ctx.arc(160, H-GROUND+20, 72, Math.PI, 0); ctx.fill();
    }

    function drawGround(){
      ctx.fillStyle = '#4fae5f'; ctx.fillRect(0, H-GROUND, W, GROUND);
      ctx.fillStyle = '#3c814a'; ctx.fillRect(0, H-GROUND, W, 7);
      ctx.fillStyle = '#43964f';
      for(let gx=0; gx<W+12; gx+=24){
        ctx.beginPath();
        ctx.moveTo(gx, H-GROUND+7);
        ctx.lineTo(gx+12, H-GROUND+7);
        ctx.lineTo(gx+6,  H-GROUND+15);
        ctx.closePath(); ctx.fill();
      }
    }

    function drawBug(b){
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.font = '26px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.em, 0, 0);
      ctx.restore();
    }

    function drawGecko(){
      const lean = Math.max(-0.32, Math.min(0.32, (geckoTargetX - geckoX) * 0.03));

      // schaduw op de grond
      ctx.fillStyle = 'rgba(0,40,20,0.16)';
      ctx.beginPath(); ctx.ellipse(geckoX, H-GROUND+9, 22, 7, 0, 0, Math.PI*2); ctx.fill();

      ctx.save();
      ctx.translate(geckoX, GECKO_Y);

      // tong-flick bij het vangen
      if(tongue > 0){
        ctx.strokeStyle = '#e23d6f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,-8 - tongue*2.6); ctx.stroke();
        ctx.fillStyle = '#e23d6f';
        ctx.beginPath(); ctx.arc(0,-8 - tongue*2.6, 3, 0, Math.PI*2); ctx.fill();
      }

      ctx.rotate(lean);
      // witte gloed voor leesbaarheid op elke achtergrond
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(0,-8, GECKO_R-2, 0, Math.PI*2); ctx.fill();
      const sq = 1 + scorePop*0.14;
      ctx.font = Math.round(44*sq) + 'px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🦎', 0, -8);
      ctx.restore();
    }

    function drawHUD(){
      // score
      ctx.font = 'bold 21px Fredoka, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = '#003399';
      ctx.strokeText('⭐ ' + score, 14, 22);
      ctx.fillStyle = '#fff'; ctx.fillText('⭐ ' + score, 14, 22);

      // levens: 3 hartjes, gedoofd bij verlies
      ctx.font = '19px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for(let i=0;i<3;i++){
        ctx.globalAlpha = i < lives ? 1 : 0.22;
        ctx.fillText('❤️', W - 22 - i*24, 22);
      }
      ctx.globalAlpha = 1;
    }

    function draw(){
      drawBackground();
      for(const b of bugs) drawBug(b);
      drawGround();
      drawParticles();
      drawGecko();
      if(state === 'play' || state === 'dead') drawHUD();

      // rode flits bij het verliezen van een leven
      if(lifeFlash > 0){
        ctx.fillStyle = 'rgba(255,60,40,' + (lifeFlash/18*0.22) + ')';
        ctx.fillRect(0,0,W,H);
      }
    }

    function loop(){
      if(!running) return;
      const spel = document.getElementById('module-spel');
      const panel = document.getElementById('gpanel-vang');
      if(!spel.classList.contains('active') || (panel && panel.hidden)){ resetToIdle(); return; }
      for(const c of clouds){ c.x -= c.v; if(c.x < -70){ c.x = W+50; c.y = 40+Math.random()*110; } }
      update();
      if(running){ updateParticles(); draw(); requestAnimationFrame(loop); }
    }

    function die(){
      running = false; state = 'dead';
      document.getElementById('vang-final-score').textContent = score;
      document.getElementById('vang-over').hidden = false;
      draw();
    }

    function startGame(){
      reset(); state = 'play';
      document.getElementById('vang-start').hidden = true;
      document.getElementById('vang-over').hidden = true;
      running = true; requestAnimationFrame(loop);
    }

    function resetToIdle(){
      running = false; state = 'idle';
      document.getElementById('vang-over').hidden = true;
      document.getElementById('vang-start').hidden = false;
      reset(); draw();
    }

    canvas.addEventListener('mousemove', e => {
      if(state !== 'play') return;
      setGeckoTarget(e.clientX, canvas.getBoundingClientRect());
    });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if(state !== 'play') return;
      setGeckoTarget(e.touches[0].clientX, canvas.getBoundingClientRect());
    }, {passive:false});

    document.getElementById('vang-btn-start').addEventListener('click', startGame);
    document.getElementById('vang-btn-retry').addEventListener('click', startGame);

    reset(); state = 'idle'; draw();
  })();
