  const tiles = document.querySelectorAll('.tile');
  const views = document.querySelectorAll('.view');
  const visited = new Set();
  let celebrated = false;

  /* ---- Geluid engine (Web Audio API) ---- */
  const SFX = (function(){
    let ctx = null, muted = localStorage.getItem('sfx-muted') === '1';
    function ac(){
      if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if(ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, dur, vol, type, freqEnd, when){
      if(muted || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      try{
        const c = ac();
        const t = c.currentTime + (when || 0) + 0.01;
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, t);
        if(freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.start(t); o.stop(t + dur + 0.02);
      }catch(e){}
    }
    return {
      tap:       ()=>{ tone(520, .08, .06); },
      back:      ()=>{ tone(400, .08, .05, 'sine', 300); },
      badge:     ()=>{ tone(523,.1,.08,null,null,0); tone(659,.1,.08,null,null,.1); tone(784,.22,.1,null,null,.2); },
      toggle:    ()=>{ tone(muted?220:440,.12,.05,'sine',muted?300:520); },
      correct:   ()=>{ tone(659,.09,.08,null,null,0); tone(880,.18,.08,null,null,.1); },
      wrong:     ()=>{ tone(280,.2,.05,'sine',220); },
      celebrate: ()=>{ [523,659,784,1047].forEach((f,i)=>tone(f,.25,.08,null,null,i*.09)); },
      sun:       ()=>{ tone(880,.07,.05,null,null,0); tone(1108,.14,.04,null,null,.07); },
      greet:     ()=>{ tone(600,.05,.03,'sine',660); },
      isMuted:   ()=>muted,
      setMuted:  (v)=>{ muted=v; localStorage.setItem('sfx-muted', v?'1':'0'); },
    };
  })();

  // Mute-knop
  (function(){
    const btn = document.getElementById('mute-toggle');
    if(!btn) return;
    function update(){ btn.textContent = SFX.isMuted()?'🔇':'🔊'; btn.classList.toggle('muted', SFX.isMuted()); btn.setAttribute('aria-label', SFX.isMuted()?'Geluid inschakelen':'Geluid uitschakelen'); }
    update();
    btn.addEventListener('click', ()=>{ SFX.setMuted(!SFX.isMuted()); SFX.toggle(); update(); });
  })();

  // Herstel eerder bezochte modules uit localStorage
  (function(){
    const saved = JSON.parse(localStorage.getItem('gekkoo-visited') || '[]');
    saved.forEach(mod => {
      visited.add(mod);
      const tile = document.querySelector('.tile[data-module="'+mod+'"]');
      if(tile) tile.classList.add('visited');
    });
    if(visited.size > 0) updateProgress();
    if(visited.size === 10) celebrated = true; // Geen herhaalde trophy bij terugkeer
  })();
  var onLeaveSpel = null;

  /* ---- Dark mode ---- */
  const darkToggle = document.getElementById('dark-toggle');
  function setToggleLabel(isDark){
    darkToggle.setAttribute('aria-label', isDark ? 'Schakel licht thema in' : 'Schakel donker thema in');
  }
  (function(){
    const saved = localStorage.getItem('theme');
    if(saved === 'dark'){ document.body.setAttribute('data-theme','dark'); setToggleLabel(true); }
  })();
  darkToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    SFX.toggle();
    launchThemeTransition(!isDark);
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    setToggleLabel(!isDark);
  });

  /* ---- Confetti ---- */
  const CONFETTI_COLORS = ['#FFCC33','#003399','#479554','#FF99CC','#FF3333','#ffffff','#FFB347'];
  const CONFETTI_DARK   = ['#ffffff','#d0dcff','#e8f0ff','#c8d8f0','#fffde0','#aabbdd','#dde8ff'];

  function launchConfetti(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const colors = isDark ? CONFETTI_DARK : CONFETTI_COLORS;
    const count = isDark ? 46 : 72;
    for(let i=0;i<count;i++){
      const el = document.createElement('div');
      el.className = isDark ? 'confetti-piece confetti-star' : 'confetti-piece';
      const sz = isDark ? 8+Math.random()*7 : 6+Math.random()*6;
      el.style.cssText = [
        `left:${Math.random()*100}vw`,
        `background:${colors[Math.floor(Math.random()*colors.length)]}`,
        `width:${sz}px`,
        `height:${isDark ? sz : 10+Math.random()*8}px`,
        isDark ? '' : `border-radius:${Math.random()>0.5?'50%':'2px'}`,
        `animation-duration:${2.4+Math.random()*2}s`,
        `animation-delay:${Math.random()*0.9}s`,
        `opacity:${0.8+Math.random()*0.2}`,
      ].filter(Boolean).join(';');
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  function launchThemeTransition(toDark){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Screen overlay: darkness falls / light rises
    const overlay = document.createElement('div');
    overlay.className = 'theme-overlay';
    overlay.style.cssText = [
      `background:${toDark ? 'rgba(4,8,22,.88)' : 'rgba(255,240,160,.82)'}`,
      'transition:opacity .35s ease',
    ].join(';');
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(() => {
        overlay.style.transition = 'opacity .55s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 600);
      }, 280);
    });

    // Central moon / sun emoji
    const center = document.createElement('div');
    center.className = 'theme-main';
    center.textContent = toDark ? '🌙' : '☀️';
    document.body.appendChild(center);
    center.addEventListener('animationend', () => center.remove());

    // Falling stars (dark) or rising suns (light)
    const DARK_COLORS  = ['#ffffff','#d0dcff','#e8f0ff','#c8d8f0','#fffde0'];
    const LIGHT_COLORS = ['#FFCC33','#FFB347','#FFE566','#fff0a0','#ffffff'];
    const colors = toDark ? DARK_COLORS : LIGHT_COLORS;
    for(let i = 0; i < 32; i++){
      const el = document.createElement('div');
      el.className = toDark ? 'theme-piece theme-piece--star' : 'theme-piece theme-piece--sun';
      const sz = 5 + Math.random() * 9;
      el.style.cssText = [
        `left:${Math.random()*100}vw`,
        `background:${colors[Math.floor(Math.random()*colors.length)]}`,
        `width:${sz}px`,
        `height:${sz}px`,
        `animation-duration:${1.1+Math.random()*1.1}s`,
        `animation-delay:${Math.random()*0.45}s`,
      ].join(';');
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  function showCelebration(){
    celebrated = true;
    SFX.celebrate();
    launchConfetti();
    const trophy = document.getElementById('trophy-banner');
    if(trophy){
      trophy.classList.add('active');
      document.getElementById('trophy-close').addEventListener('click', () => {
        trophy.classList.remove('active');
      }, {once:true});
      trophy.addEventListener('click', e => {
        if(e.target === trophy) trophy.classList.remove('active');
      });
    }
  }

  /* ---- Logo: confetti + bounce animatie bij elke klik ---- */
  const logoBtn = document.getElementById('logo-confetti');
  function logoActivate(){
    launchConfetti();
    if(logoBtn){
      logoBtn.style.transition = 'transform .15s ease';
      logoBtn.style.transform = 'scale(1.18) rotate(-6deg)';
      setTimeout(() => { logoBtn.style.transform = 'scale(1) rotate(0deg)'; }, 200);
    }
    const active = document.querySelector('.view.active');
    if(active && active.id !== 'hub') showView('hub');
  }
  if(logoBtn){
    logoBtn.addEventListener('click', logoActivate);
    logoBtn.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); logoActivate(); }
    });
  }

  /* ---- Interactieve homepage-extra's: zwaaiende begroeting + binnenkomende tegels ---- */
  (function(){
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Multitalige begroeting op de zwaaiende hand, ook automatisch wisselen
    const wave = document.getElementById('wave-emoji');
    const greetWord = document.getElementById('greet-word');
    const greetings = [
      'Welkom','Hallo','Hoi','Hey',
      'Salut','Bonjour',
      'Hello','Hi',
      'Hola','Ciao',
      'Merhaba',
      'مرحبا',
      'こんにちは',
    ];
    let gi = 0;
    if(wave && greetWord){
      const cycleGreeting = (withFlair) => {
        gi = (gi + 1) % greetings.length;
        greetWord.classList.add('swap');
        setTimeout(() => {
          greetWord.textContent = greetings[gi];
          greetWord.classList.remove('swap');
        }, 150);
        if(withFlair && !reduce){
          wave.classList.remove('waving');
          requestAnimationFrame(() => wave.classList.add('waving'));
          const r = wave.getBoundingClientRect();
          sparkle(r.left + r.width/2, r.top + r.height/2);
        }
      };
      const doWave   = () => { SFX.greet(); cycleGreeting(true); };
      const autoCycle = () => cycleGreeting(false);
      wave.addEventListener('click', doWave);
      wave.addEventListener('keydown', e => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); doWave(); }
      });
      wave.addEventListener('animationend', () => wave.classList.remove('waving'));
      if(!reduce) setInterval(autoCycle, 3200);
    }

    // Sparkles op een gegeven schermpositie
    const SPARKS = ['✨','⭐','🌟','💫'];
    function sparkle(x, y){
      if(reduce) return;
      const n = 7;
      for(let i=0;i<n;i++){
        const s = document.createElement('span');
        s.className = 'spark';
        s.textContent = SPARKS[Math.floor(Math.random()*SPARKS.length)];
        const ang = (Math.PI * 2 * i) / n + Math.random()*0.5;
        const dist = 28 + Math.random()*34;
        s.style.left = x + 'px';
        s.style.top = y + 'px';
        s.style.setProperty('--dx', Math.cos(ang)*dist + 'px');
        s.style.setProperty('--dy', Math.sin(ang)*dist + 'px');
        s.style.setProperty('--rot', (Math.random()*180-90) + 'deg');
        s.style.fontSize = (0.7 + Math.random()*0.7) + 'rem';
        document.body.appendChild(s);
        s.addEventListener('animationend', () => s.remove());
      }
    }

    // Tegels gestaggerd laten binnenkomen bij het openen van de hub
    if(!reduce){
      document.querySelectorAll('#hub .tiles .tile').forEach((t,i) => {
        t.classList.add('tile-enter');
        t.style.animationDelay = (i*70) + 'ms';
        t.addEventListener('animationend', () => {
          t.classList.remove('tile-enter');
          t.style.animationDelay = '';
        }, {once:true});
      });
    }
  })();

  /* ---- Aftelklok naar de zomer (1 juli) ---- */
  (function(){
    const elDays = document.getElementById('cd-days');
    const elHours = document.getElementById('cd-hours');
    const elMins = document.getElementById('cd-mins');
    const elSecs = document.getElementById('cd-secs');
    const elTitle = document.getElementById('cd-title');
    const elSub = document.getElementById('cd-sub');
    const elUnits = document.getElementById('cd-units');
    const sun = document.getElementById('cd-sun');
    const bubble = document.getElementById('cd-bubble');
    if(!elDays || !sun) return;

    function nextSummerTarget(){
      const now = new Date();
      let target = new Date(now.getFullYear(), 6, 1, 0, 0, 0); // 1 juli, lokale tijd (maand 6 = juli)
      if(now >= target){
        target = new Date(now.getFullYear() + 1, 6, 1, 0, 0, 0);
      }
      return target;
    }

    function pad(n){ return String(n).padStart(2,'0'); }

    function tick(){
      const now = new Date();
      const target = nextSummerTarget();
      const diff = target - now;

      if(diff <= 0){
        elTitle.textContent = 'Het is zomer! ☀️';
        elUnits.innerHTML = '<span class="cd-done">Geniet ervan!</span>';
        elSub.textContent = 'tot 1 juli ☀️';
        return;
      }
      const sec = Math.floor(diff / 1000);
      const days = Math.floor(sec / 86400);
      const hours = Math.floor((sec % 86400) / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = sec % 60;

      elDays.textContent = pad(days);
      elHours.textContent = pad(hours);
      elMins.textContent = pad(mins);
      elSecs.textContent = pad(secs);
    }

    tick();
    setInterval(tick, 1000);

    /* Interactief zonnetje: tik en krijg een speels berichtje */
    const sunMessages = [
      'Tik! De zon groet je terug ☀️',
      'Bijna tijd voor ijsjes 🍦',
      'Korte broeken klaarleggen 🩳',
      'Zonnebrand niet vergeten 🧴',
      'Zomerse vibes onderweg 😎',
      'Waterpistolen poetsen 💦',
      'Nog even doorzetten, het komt eraan!',
      'De zon vindt jou alvast top ⭐'
    ];
    let bubbleTimer = null;
    let sunMsgIndex = 0;
    function showSunMessage(){
      SFX.sun();
      sun.classList.remove('spin');
      requestAnimationFrame(() => sun.classList.add('spin'));
      bubble.textContent = sunMessages[sunMsgIndex % sunMessages.length];
      sunMsgIndex++;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 2800);
    }
    sun.addEventListener('click', showSunMessage);
    sun.addEventListener('animationend', () => sun.classList.remove('spin'));
  })();

  function showView(id, push){
    const prev = document.querySelector('.view.active');
    if(prev && prev.id === 'module-spel' && id !== 'module-spel' && typeof onLeaveSpel === 'function'){
      onLeaveSpel();
    }
    views.forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.body.classList.toggle('in-module', id !== 'hub');
    window.scrollTo({top:0, behavior:'smooth'});
    if(push !== false) history.pushState({view: id}, '');
    if(id === 'module-regio' && typeof window.__applyRegioState === 'function'){
      window.__applyRegioState();
    }
    if(id === 'hub' && !celebrated && visited.size === 10){
      setTimeout(showCelebration, 400);
    }
  }

  history.replaceState({view: 'hub'}, '');
  window.addEventListener('popstate', function(e){
    const id = (e.state && e.state.view) || 'hub';
    if(document.getElementById(id)) showView(id, false);
  });

  function updateProgress(){
    document.getElementById('progress').textContent = visited.size + " van 10 pagina's ontdekt";
    const fill = document.getElementById('progress-fill');
    if(fill) fill.style.width = (visited.size / 10 * 100) + '%';
  }

  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      SFX.tap();
      const mod = tile.dataset.module;
      let isNew = false;
      if(tile.dataset.progress !== 'false'){
        isNew = !visited.has(mod);
        visited.add(mod);
        tile.classList.add('visited');
        updateProgress();
      }
      showView('module-' + mod);
      if(isNew) document.dispatchEvent(new CustomEvent('moduleVisited', {detail: mod}));
    });
  });

  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => { SFX.back(); history.back(); });
  });

  /* ---- Huisreglement: hoofdstuk-navigatie ---- */
  const hrNums = document.querySelectorAll('.hr-num');
  const hrPages = document.querySelectorAll('.hr-page');

  function goToChapter(target){
    hrNums.forEach(b => {
      const on = b.dataset.hr === target;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    hrPages.forEach(p => p.classList.toggle('active', p.dataset.hrpage === target));
    const hrSection = document.getElementById('module-huisreglement');
    if (hrSection) hrSection.scrollIntoView({behavior:'smooth', block:'start'});
  }

  hrNums.forEach(btn => btn.addEventListener('click', () => goToChapter(btn.dataset.hr)));
  document.querySelectorAll('.hr-prev, .hr-next').forEach(btn => {
    btn.addEventListener('click', () => goToChapter(btn.dataset.hr));
  });

  /* ---- Wat als? quiz ---- */
  const scenarios = [
    {
      icon: '🥎',
      text: 'Twee kinderen hebben ruzie. Ze willen allebei met dezelfde bal spelen. Wat doe jij?',
      options: [
        {label: 'Ik pak de bal af. Niemand mag er nog mee spelen.', correct:false, feedback:'Dat lost de ruzie niet echt op. De kinderen blijven gefrustreerd. Probeer eerst te luisteren.'},
        {label: 'Ik luister naar beide kinderen. Samen zoeken we een oplossing.', correct:true, feedback:'Goed gedaan! Luisteren en samen een oplossing zoeken werkt het best.'},
        {label: 'Ik zeg: los het zelf maar op.', correct:false, feedback:'Soms kunnen kinderen het zelf oplossen. Maar bij ruzie blijf je best even in de buurt om te helpen.'}
      ]
    },
    {
      icon: '😟',
      text: 'Een kind durft niet mee te doen met het spel. Het kind is verlegen of bang. Wat doe jij?',
      options: [
        {label: 'Ik laat het kind gewoon. Het komt wel goed.', correct:false, feedback:'Het kind heeft misschien net een beetje extra steun nodig om te durven.'},
        {label: 'Ik moedig het kind rustig aan en help het een eerste stapje te zetten.', correct:true, feedback:'Goed gedaan! Rustig aanmoedigen en samen een eerste stap zetten, helpt veel kinderen over de drempel.'},
        {label: 'Ik zeg dat het kind moet meedoen, anders mag het niet meer komen spelen.', correct:false, feedback:'Druk zetten maakt het meestal erger. Een kind moet zich veilig voelen, niet verplicht.'}
      ]
    },
    {
      icon: '🧭',
      text: 'Een kind is zijn groep kwijt en weet niet meer waar iedereen is. Wat doe jij?',
      options: [
        {label: 'Ik zoek snel mee, stel het kind gerust en verwittig de hoofdanimator.', correct:true, feedback:'Goed gedaan! Snel handelen en geruststellen is precies wat een verdwaald kind nodig heeft.'},
        {label: 'Ik zeg: zoek zelf je groep maar terug.', correct:false, feedback:'Een kind dat zijn groep kwijt is, kan in paniek raken. Help altijd mee zoeken.'},
        {label: 'Ik wacht af. Het kind vindt zijn groep wel terug.', correct:false, feedback:'Wachten kan gevaarlijk zijn. Handel snel.'}
      ]
    },
    {
      icon: '🚫',
      text: 'Andere kinderen pesten een kind of sluiten het buiten. Wat doe jij?',
      options: [
        {label: 'Ik grijp in: ik stop het pesten en praat erover met de groep.', correct:true, feedback:'Goed gedaan! Ingrijpen, het pesten stoppen, en er samen over praten is belangrijk.'},
        {label: 'Ik doe alsof ik het niet zie. Kinderen lossen dit vaak zelf op.', correct:false, feedback:'Pesten lost zichzelf bijna nooit op. Jij moet ingrijpen.'},
        {label: 'Ik zeg tegen het gepeste kind dat het zich niet zo moet aanstellen.', correct:false, feedback:'Dit maakt het voor het gepeste kind nog moeilijker. Steun het kind altijd.'}
      ]
    },
    {
      icon: '🌧️',
      text: 'Het regent. Jullie kunnen niet naar buiten. De kinderen vervelen zich. Wat doe jij?',
      options: [
        {label: 'Ik laat de kinderen gewoon zitten wachten tot het droog is.', correct:false, feedback:'Wachten zonder iets te doen zorgt voor verveling en onrust.'},
        {label: 'Ik zorg voor een leuke activiteit binnen, zodat iedereen toch plezier heeft.', correct:true, feedback:'Goed gedaan! Een leuke binnenactiviteit voorzien houdt iedereen blij en bezig.'},
        {label: 'Ik zeg dat ze zelf maar iets moeten verzinnen.', correct:false, feedback:'Kinderen hebben vaak wat sturing nodig, vooral als ze zich vervelen.'}
      ]
    },
    {
      icon: '🤢',
      text: 'Tijdens een activiteit zegt een kind dat het buikpijn heeft en zich niet goed voelt. Wat doe jij?',
      options: [
        {label: 'Ik zeg dat het vast wel meevalt en dat het gewoon meedoet.', correct:false, feedback:'Een ziek kind negeren is nooit oké. Neem elke klacht serieus, ook als je twijfelt.'},
        {label: 'Ik laat het kind rustig zitten, verwittig een andere vrijwilliger en contacteer de ouders.', correct:true, feedback:'Goed gedaan! Rustig houden, iemand informeren en de ouders contacteren is de juiste aanpak.'},
        {label: 'Ik stuur het kind meteen alleen naar huis.', correct:false, feedback:'Een kind alleen wegsturen is gevaarlijk. Zorg altijd dat een ouder of vertrouwde volwassene het ophaalt.'}
      ]
    },
    {
      icon: '⏰',
      text: 'De activiteit is gedaan, maar de ouders van één kind zijn nog steeds niet komen opdagen. Wat doe jij?',
      options: [
        {label: 'Ik wacht een kwartiertje en vertrek daarna. Het kind kent de weg.', correct:false, feedback:'Laat een kind nooit alleen achter. Jij blijft verantwoordelijk tot je het veilig overdraagt aan een ouder.'},
        {label: 'Ik probeer de ouders te bereiken. Als dat niet lukt, verwittig ik de hoofdverantwoordelijke.', correct:true, feedback:'Goed gedaan! Altijd contact opnemen en de verantwoordelijke verwittigen als je geen gehoor krijgt.'},
        {label: 'Ik geef het kind mee met een andere ouder die er toevallig ook nog is.', correct:false, feedback:'Zonder expliciete toestemming van de ouders geef je een kind niet mee met iemand anders.'}
      ]
    },
    {
      icon: '🤔',
      text: 'Je ziet dat een collega-vrijwilliger iets doet waarmee jij het niet eens bent. Niet iets gevaarlijks, maar toch. Wat doe jij?',
      options: [
        {label: 'Ik zeg niets. Het is zijn of haar verantwoordelijkheid.', correct:false, feedback:'Zwijgen lost niets op. Een open gesprek achteraf is altijd beter dan je ergernis inhouden.'},
        {label: 'Ik val hem of haar meteen publiekelijk terecht voor de kinderen.', correct:false, feedback:'Dat kan beschamend zijn. Spreek elkaar altijd aan buiten het zicht van de kinderen.'},
        {label: 'Ik spreek hem of haar achteraf rustig aan en bespreek het samen.', correct:true, feedback:'Goed gedaan! Rustig en onder vier ogen feedback geven is de professionele aanpak.'}
      ]
    },
    {
      icon: '🏃',
      text: 'Tijdens een spel daagt een kind de andere kinderen uit om iets gevaarlijks te proberen. De anderen willen het doen. Wat doe jij?',
      options: [
        {label: 'Ik grijp meteen in, stop het gedrag en leg rustig uit waarom het niet veilig is.', correct:true, feedback:'Goed gedaan! Direct ingrijpen en uitleggen waarom het gevaarlijk is, is de juiste reactie.'},
        {label: 'Ik wacht af. Kinderen moeten ook een beetje risico leren inschatten.', correct:false, feedback:'Bij gevaarlijke situaties moet je altijd meteen ingrijpen. Wachten is hier geen optie.'},
        {label: 'Ik zeg niets maar kijk wel toe zodat ik kan helpen als het misloopt.', correct:false, feedback:'Grijp in voordat het misloopt. Dat is altijd beter dan achteraf herstellen.'}
      ]
    }
  ];

  let current = 0;
  let quizScore = 0;
  const quizCard = document.getElementById('quiz-card');

  function renderScenario(){
    if(current >= scenarios.length){
      const pct = Math.round(quizScore / scenarios.length * 100);
      const emoji = pct === 100 ? '🏆' : pct >= 60 ? '🎉' : '💪';
      quizCard.innerHTML = `
        <div class="quiz-done">
          <div class="ic" aria-hidden="true">${emoji}</div>
          <h3>${pct === 100 ? 'Perfect!' : 'Goed gedaan!'}</h3>
          <p>Je had <strong>${quizScore} van ${scenarios.length}</strong> situaties correct.</p>
          <button class="next-btn" id="quiz-restart" style="display:inline-flex;margin-top:1rem">Opnieuw spelen →</button>
        </div>`;
      document.getElementById('quiz-restart').addEventListener('click', () => {
        current = 0; quizScore = 0; renderScenario();
      });
      if(pct === 100) setTimeout(launchConfetti, 200);
      return;
    }
    const s = scenarios[current];
    let optionsHtml = s.options.map((o,i) =>
      `<button class="option-btn" data-i="${i}">${o.label}</button>`
    ).join('');
    let dotsHtml = scenarios.map((_,i) =>
      `<span class="dot ${i===current?'active':''}"></span>`
    ).join('');

    quizCard.innerHTML = `
      <div class="quiz-scenario">
        <span class="ic" aria-hidden="true">${s.icon}</span>
        <p>${s.text}</p>
      </div>
      <div class="options">${optionsHtml}</div>
      <div class="feedback" id="feedback" role="status" aria-live="polite"></div>
      <div class="quiz-nav">
        <div class="dots">${dotsHtml}</div>
        <button class="next-btn" id="next-btn">Volgende →</button>
      </div>
    `;

    quizCard.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const opt = s.options[btn.dataset.i];
        quizCard.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        btn.classList.add('selected');
        if(opt.correct){ btn.classList.add('is-correct'); quizScore++; SFX.correct(); }
        else { SFX.wrong();
          const correctBtn = quizCard.querySelector(`.option-btn[data-i="${s.options.findIndex(o=>o.correct)}"]`);
          if(correctBtn) correctBtn.classList.add('is-correct');
        }
        const fb = document.getElementById('feedback');
        fb.textContent = (opt.correct ? '✅ ' : '💡 ') + opt.feedback;
        fb.classList.add('show');
        if(opt.correct) fb.classList.add('correct');
        const nextBtn = document.getElementById('next-btn');
        nextBtn.classList.add('show');
        setTimeout(() => nextBtn.scrollIntoView({behavior:'smooth', block:'nearest'}), 80);
      });
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      current++;
      renderScenario();
    });
  }

  renderScenario();

  /* ---- Game tabs ---- */
  document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if(tab.dataset.game !== 'hop' && typeof onLeaveSpel === 'function') onLeaveSpel();
      document.querySelectorAll('.game-tab').forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      document.querySelectorAll('.game-panel').forEach(p => {
        p.hidden = p.id !== 'gpanel-' + tab.dataset.game;
      });
    });
  });

  /* ---- Huisreglement mini-quiz (4-ogen-principe) ---- */
  const hrQuestion = {
    icon: '👀',
    text: 'Je merkt dat een collega-vrijwilliger alleen binnen is met 1 kind. Wat doe jij?',
    options: [
      {label: 'Niks, dat is hun zaak.', correct:false, feedback:'Bij Gekkoo doen we dit nooit alleen. Ga er gewoon even bij, of vraag een andere collega mee, geen verwijt, gewoon de afspraak.'},
      {label: 'Ik ga er even bij, of vraag een andere collega om mee te gaan.', correct:true, feedback:'Goed gedaan! Dit is het 4-ogen-principe: er zijn altijd minstens 2 begeleiders bij kinderen.'},
      {label: 'Ik zeg meteen dat dit niet mag en loop weg.', correct:false, feedback:'Het hoeft geen verwijt te zijn. Gewoon er even bijgaan is meestal al genoeg.'}
    ]
  };

  const hrQuiz = document.getElementById('hr-quiz');
  if(hrQuiz){
    let hrOptionsHtml = hrQuestion.options.map((o,i) =>
      `<button class="option-btn" data-i="${i}">${o.label}</button>`
    ).join('');
    hrQuiz.innerHTML = `
      <div class="quiz-scenario">
        <span class="ic" aria-hidden="true">${hrQuestion.icon}</span>
        <p>${hrQuestion.text}</p>
      </div>
      <div class="options">${hrOptionsHtml}</div>
      <div class="feedback" id="hr-feedback" role="status" aria-live="polite"></div>
    `;
    hrQuiz.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const opt = hrQuestion.options[btn.dataset.i];
        hrQuiz.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        btn.classList.add('selected');
        if(opt.correct){ btn.classList.add('is-correct'); }
        else {
          const correctBtn = hrQuiz.querySelector(`.option-btn[data-i="${hrQuestion.options.findIndex(o=>o.correct)}"]`);
          if(correctBtn) correctBtn.classList.add('is-correct');
        }
        const fb = document.getElementById('hr-feedback');
        fb.textContent = (opt.correct ? '✅ ' : '💡 ') + opt.feedback;
        fb.classList.add('show');
        if(opt.correct) fb.classList.add('correct');
      });
    });
  }

  /* ---- Klik-om-te-kopiëren (tel: en mailto:) ---- */
  (function(){
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    document.body.appendChild(toast);
    let timer;
    function showToast(msg){
      clearTimeout(timer);
      toast.textContent = msg;
      toast.classList.add('show');
      timer = setTimeout(() => toast.classList.remove('show'), 2200);
    }
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
      if(!link || !navigator.clipboard) return;
      const raw = link.getAttribute('href');
      const text = raw.replace(/^tel:\+32/, '0').replace(/^tel:/, '').replace(/^mailto:/, '');
      navigator.clipboard.writeText(text).then(() => showToast('📋 ' + text + ' gekopieerd!')).catch(() => {});
    });
  })();

  /* ---- Badge systeem ---- */
  (function(){
    const miniShelf  = document.getElementById('mini-badge-shelf');
    const trophyBtn  = document.getElementById('trophy-btn');
    const TOTAL      = 10;

    function checkComplete(){
      const earned = miniShelf ? miniShelf.querySelectorAll('.badge-slot.earned').length : 0;
      if(earned >= TOTAL){
        document.body.classList.add('badges-complete');
        if(miniShelf)  miniShelf.classList.add('shelf-hidden');
        if(trophyBtn)  trophyBtn.classList.add('visible');
      }
    }

    function markSlot(mod){
      if(!miniShelf) return;
      miniShelf.querySelectorAll('.badge-slot[data-badge="'+mod+'"]')
        .forEach(function(s){ s.classList.add('earned'); });
    }

    function earnBadge(mod, instant){
      const slot = miniShelf && miniShelf.querySelector('.badge-slot[data-badge="'+mod+'"]');
      if(!slot || slot.classList.contains('earned')) return;

      if(instant){ markSlot(mod); return; }

      SFX.badge();
      const icon   = slot.querySelector('.badge-ic').textContent;
      const sRect  = slot.getBoundingClientRect();
      const endX   = sRect.left + sRect.width  / 2;
      const endY   = sRect.top  + sRect.height / 2;
      const startX = window.innerWidth  / 2;
      const startY = window.innerHeight * 0.42;

      const fly = document.createElement('div');
      fly.className = 'badge-fly';
      fly.innerHTML = '<span class="badge-fly-ic">'+icon+'</span><span class="badge-fly-lbl">Badge behaald!</span>';
      document.body.appendChild(fly);

      if(fly.animate){
        fly.animate([
          { transform:'translate('+startX+'px,'+startY+'px) translate(-50%,-50%) scale(0)',   opacity:0 },
          { transform:'translate('+startX+'px,'+startY+'px) translate(-50%,-50%) scale(1)',   opacity:1, offset:.28 },
          { transform:'translate('+startX+'px,'+startY+'px) translate(-50%,-50%) scale(1)',   opacity:1, offset:.65 },
          { transform:'translate('+endX  +'px,'+endY  +'px) translate(-50%,-50%) scale(.22)', opacity:0 },
        ],{ duration:1100, easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards' });
      }

      setTimeout(function(){
        fly.remove();
        markSlot(mod);
        checkComplete();
      }, 1050);
    }

    // Herstel eerder behaalde badges
    visited.forEach(function(mod){ earnBadge(mod, true); });
    checkComplete();

    // Nieuwe bezoeken
    document.addEventListener('moduleVisited', e => {
      earnBadge(e.detail, false);
      localStorage.setItem('gekkoo-visited', JSON.stringify(Array.from(visited)));
    });

    // Trophy-knop: shelf aan/uit
    if(trophyBtn){
      trophyBtn.addEventListener('click', function(){
        if(!miniShelf) return;
        const nowHidden = miniShelf.classList.toggle('shelf-hidden');
        trophyBtn.classList.toggle('shelf-open', !nowHidden);
      });
    }
  })();

  /* ---- Designer tools (console only) ---- */
  window.gekkoo = {
    reset: function(){
      ['gekkoo-visited','sfx-muted','theme'].forEach(function(k){ localStorage.removeItem(k); });
      location.reload();
    },
    status: function(){
      console.table({
        visited:  localStorage.getItem('gekkoo-visited'),
        muted:    localStorage.getItem('sfx-muted'),
        theme:    localStorage.getItem('theme'),
      });
    },
  };


  /* ---- Easter egg: 10x logo klikken ---- */
  (function(){
    let clicks = 0, eggTimer;
    const logo = document.getElementById('logo-confetti');
    if(!logo) return;
    logo.addEventListener('click', () => {
      clicks++;
      clearTimeout(eggTimer);
      eggTimer = setTimeout(() => { clicks = 0; }, 4000);
      if(clicks < 10) return;
      clicks = 0;

      // Confetti x3
      launchConfetti();
      setTimeout(launchConfetti, 350);
      setTimeout(launchConfetti, 700);

      // Regenboog-flash
      const overlay = document.createElement('div');
      overlay.className = 'easter-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('animationend', () => overlay.remove());

      // Toast
      const toast = document.createElement('div');
      toast.className = 'easter-toast';
      toast.innerHTML = '🎉 Easter egg gevonden! 🦎<br><span style="font-size:.85rem;font-weight:500;opacity:.85">Jij bent écht een Gekkoo-expert!</span>';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3500);

    });
  })();

  /* ---- Zoekfunctie ---- */
  (function(){
    const trigger = document.getElementById('search-trigger');
    const overlay = document.getElementById('search-overlay');
    const input   = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const hint    = document.getElementById('search-hint');
    const closeBtn= document.getElementById('search-close');
    if(!trigger || !overlay) return;

    // Index opbouwen uit de DOM
    const index = [];
    document.querySelectorAll('#hub .tiles .tile').forEach(function(tile){
      const mod = tile.dataset.module;
      const sec = document.getElementById('module-'+mod);
      index.push({
        icon: (tile.querySelector('.tile-icon')||{}).textContent || '📄',
        title: (tile.querySelector('.tile-title')||{}).textContent.trim(),
        cat: 'Onderdeel',
        snippet: (tile.querySelector('.tile-desc')||{}).textContent.trim(),
        text: (sec ? sec.textContent : '').replace(/\s+/g,' ').trim(),
        go: function(){ showView('module-'+mod); }
      });
    });
    document.querySelectorAll('.faq-item').forEach(function(item){
      const q = (item.querySelector('.faq-q')||{}).textContent.trim();
      const a = (item.querySelector('.faq-a')||{}).textContent.trim();
      index.push({
        icon:'💬', title:q, cat:'Vraag', snippet:a, text:(q+' '+a),
        go: function(){ showView('hub'); item.open = true; setTimeout(function(){ item.scrollIntoView({behavior:'smooth',block:'center'}); }, 360); }
      });
    });
    document.querySelectorAll('#module-huisreglement .hr-page').forEach(function(page){
      const key = page.dataset.hrpage;
      const title = (page.querySelector('.band-title')||{}).textContent.trim();
      index.push({
        icon:'📋', title:'Huisreglement: '+title, cat:'Huisreglement',
        snippet:(page.querySelector('.band-intro')||{}).textContent.trim(),
        text: page.textContent.replace(/\s+/g,' ').trim(),
        go: function(){ showView('module-huisreglement'); setTimeout(function(){ goToChapter(key); }, 60); }
      });
    });

    let matches = [], active = -1;

    function escapeHtml(s){ return s.replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
    function highlight(s, q){
      const esc = escapeHtml(s);
      if(!q) return esc;
      try{
        const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
        return esc.replace(re, '<span class="sr-mark">$1</span>');
      }catch(e){ return esc; }
    }

    function run(){
      const q = input.value.trim().toLowerCase();
      results.innerHTML = '';
      active = -1;
      if(!q){ matches = []; hint.textContent = 'Typ om te zoeken in alle onderdelen, vragen en het huisreglement.'; hint.hidden = false; return; }
      const words = q.split(/\s+/);
      matches = [];
      index.forEach(function(e){
        const hay = (e.title+' '+e.text).toLowerCase();
        if(words.every(function(w){ return hay.indexOf(w) !== -1; })){
          let score = 0; const tl = e.title.toLowerCase();
          words.forEach(function(w){ if(tl.indexOf(w) !== -1) score += 10; });
          if(tl.indexOf(q) !== -1) score += 20;
          matches.push({e:e, score:score});
        }
      });
      matches.sort(function(a,b){ return b.score - a.score; });
      matches = matches.slice(0,12).map(function(m){ return m.e; });

      if(!matches.length){ hint.textContent = 'Niets gevonden voor "'+input.value.trim()+'". Probeer een ander woord.'; hint.hidden = false; return; }
      hint.hidden = true;
      matches.forEach(function(e, i){
        const li = document.createElement('li');
        li.setAttribute('role','option');
        li.innerHTML = '<span class="sr-ic" aria-hidden="true">'+e.icon+'</span><span class="sr-text"><span class="sr-cat">'+escapeHtml(e.cat)+'</span><div class="sr-title">'+highlight(e.title,q)+'</div><div class="sr-snip">'+highlight(e.snippet||'', q)+'</div></span>';
        li.addEventListener('click', function(){ choose(e); });
        results.appendChild(li);
      });
    }

    function choose(e){ close(); e.go(); }

    function setActive(n){
      const items = results.querySelectorAll('li');
      if(!items.length) return;
      active = (n + items.length) % items.length;
      items.forEach(function(li,i){ li.classList.toggle('active', i===active); });
      items[active].scrollIntoView({block:'nearest'});
    }

    function open(){
      overlay.hidden = false;
      requestAnimationFrame(function(){ overlay.classList.add('open'); });
      input.value = ''; run(); input.focus();
    }
    function close(){
      overlay.classList.remove('open');
      setTimeout(function(){ overlay.hidden = true; }, 250);
    }

    trigger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(e){ if(e.target === overlay) close(); });
    input.addEventListener('input', run);
    document.addEventListener('keydown', function(e){
      if(e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName) && overlay.hidden){
        e.preventDefault(); open();
      }
      if(overlay.hidden) return;
      if(e.key === 'Escape'){ close(); }
      else if(e.key === 'ArrowDown'){ e.preventDefault(); setActive(active+1); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); setActive(active-1); }
      else if(e.key === 'Enter'){ if(active >= 0 && matches[active]) choose(matches[active]); else if(matches.length) choose(matches[0]); }
    });
  })();

  /* ---- Back-to-top ---- */
  (function(){
    const btn = document.getElementById('back-to-top');
    if(!btn) return;
    function update(){ btn.classList.toggle('visible', window.scrollY > 400); }
    window.addEventListener('scroll', update, {passive:true});
    update();
    btn.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  })();

  /* ---- Zen-modus ---- */
  (function(){
    const toggle = document.getElementById('zen-toggle');
    const exit   = document.getElementById('zen-exit');
    if(!toggle) return;
    function setZen(on){ document.body.classList.toggle('zen', on); }
    toggle.addEventListener('click', function(){ setZen(!document.body.classList.contains('zen')); });
    if(exit) exit.addEventListener('click', function(){ setZen(false); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && document.body.classList.contains('zen')) setZen(false);
    });
  })();

  /* ---- Contextuele tooltips ---- */
  (function(){
    const tip = document.createElement('div');
    tip.id = 'tooltip';
    document.body.appendChild(tip);
    let cur = null;
    function show(el){
      const txt = el.getAttribute('data-tip');
      if(!txt) return;
      tip.textContent = txt;
      tip.classList.add('show');
      const r = el.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      let left = r.left + r.width/2 - tr.width/2;
      left = Math.max(8, Math.min(left, window.innerWidth - tr.width - 8));
      let top = r.top - tr.height - 10;
      let below = false;
      if(top < 8){ top = r.bottom + 10; below = true; }
      tip.classList.toggle('below', below);
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
      tip.style.setProperty('--arrow', (r.left + r.width/2 - left) + 'px');
    }
    function hide(){ tip.classList.remove('show'); cur = null; }
    document.addEventListener('mouseover', function(e){
      const el = e.target.closest('[data-tip]');
      if(el && el !== cur){ cur = el; show(el); }
    });
    document.addEventListener('mouseout', function(e){
      if(e.target.closest('[data-tip]')) hide();
    });
    document.addEventListener('focusin', function(e){
      const el = e.target.closest('[data-tip]');
      if(el){ cur = el; show(el); }
    });
    document.addEventListener('focusout', hide);
    window.addEventListener('scroll', hide, {passive:true});
  })();

  /* ---- Magnetische knoppen (primaire CTA's) ---- */
  (function(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if(window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.game-btn, .review-btn, .lock-btn').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width/2);
        const my = e.clientY - (r.top + r.height/2);
        el.style.transform = 'translate(' + (mx*0.22) + 'px,' + (my*0.32) + 'px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform = ''; });
    });
  })();

  /* ---- Service Worker (PWA offline) ---- */
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }

