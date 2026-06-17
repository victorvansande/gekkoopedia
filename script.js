  const views = document.querySelectorAll('.view');
  const visited = new Set();
  let celebrated = false;
  let onLeaveSpel = null;

  /* ---- Confetti ---- */
  const CONFETTI_COLORS = ['#FFCC33','#003399','#479554','#FF99CC','#FF3333','#ffffff','#FFB347'];

  function launchConfetti(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const count = 72;
    for(let i=0;i<count;i++){
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = [
        `left:${Math.random()*100}vw`,
        `background:${CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)]}`,
        `width:${6+Math.random()*6}px`,
        `height:${10+Math.random()*8}px`,
        `border-radius:${Math.random()>0.5?'50%':'2px'}`,
        `animation-duration:${2.4+Math.random()*2}s`,
        `animation-delay:${Math.random()*0.9}s`,
        `opacity:${0.75+Math.random()*0.25}`,
      ].join(';');
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  function showCelebration(){
    celebrated = true;
    launchConfetti();
    const banner = document.getElementById('celebration-banner');
    banner.classList.add('active');
    banner.querySelector('.cel-close').addEventListener('click', () => {
      banner.classList.remove('active');
    }, {once:true});
  }

  /* ---- Logo: altijd confetti, en terug naar start vanaf een onderdeel ---- */
  const logoBtn = document.getElementById('logo-confetti');
  function logoActivate(){
    launchConfetti();
    const active = document.querySelector('.view.active');
    if(active && active.id !== 'hub'){
      showView('hub');
    }
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

    // Multitalige begroeting op de zwaaiende hand
    const wave = document.getElementById('wave-emoji');
    const greetWord = document.getElementById('greet-word');
    const greetings = ['Welkom','Hallo','Salut','Hola','Ciao','Merhaba','Bonjour','Hoi','Hey','Habari'];
    let gi = 0;
    if(wave && greetWord){
      const doWave = () => {
        if(!reduce){
          wave.classList.remove('waving');
          requestAnimationFrame(() => wave.classList.add('waving'));
          const r = wave.getBoundingClientRect();
          sparkle(r.left + r.width/2, r.top + r.height/2);
        }
        gi = (gi + 1) % greetings.length;
        greetWord.classList.add('swap');
        setTimeout(() => {
          greetWord.textContent = greetings[gi];
          greetWord.classList.remove('swap');
        }, 150);
      };
      wave.addEventListener('click', doWave);
      wave.addEventListener('keydown', e => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); doWave(); }
      });
      wave.addEventListener('animationend', () => wave.classList.remove('waving'));
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

      elDays.textContent = days;
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
    sun.addEventListener('click', () => {
      sun.classList.remove('spin');
      requestAnimationFrame(() => sun.classList.add('spin'));
      const msg = sunMessages[Math.floor(Math.random() * sunMessages.length)];
      bubble.textContent = msg;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 2200);
    });
    sun.addEventListener('animationend', () => sun.classList.remove('spin'));
  })();

  function showView(id){
    const prev = document.querySelector('.view.active');
    if(prev && prev.id === 'module-spel' && id !== 'module-spel' && typeof onLeaveSpel === 'function'){
      onLeaveSpel();
    }
    views.forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo({top:0, behavior:'smooth'});
    if(id === 'module-regio' && typeof window.__applyRegioState === 'function'){
      window.__applyRegioState();
    }
    if(id === 'hub' && !celebrated && visited.size === 10){
      setTimeout(showCelebration, 400);
    }
  }

  function updateProgress(){
    document.getElementById('progress').textContent = visited.size + ' van 10 ontdekt';
  }

  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      const mod = tile.dataset.module;
      if(tile.dataset.progress !== 'false'){
        visited.add(mod);
        tile.classList.add('visited');
        updateProgress();
      }
      showView('module-' + mod);
    });
  });

  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => showView('hub'));
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
      text: 'Een kind wordt gepest of buitengesloten door andere kinderen. Wat doe jij?',
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
    }
  ];

  let current = 0;
  const quizCard = document.getElementById('quiz-card');

  function renderScenario(){
    if(current >= scenarios.length){
      quizCard.innerHTML = `
        <div class="quiz-done">
          <div class="ic" aria-hidden="true">🎉</div>
          <h3>Goed gedaan!</h3>
          <p>Je hebt alle situaties bekeken.</p>
        </div>`;
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
        if(opt.correct){ btn.classList.add('is-correct'); }
        else {
          const correctBtn = quizCard.querySelector(`.option-btn[data-i="${s.options.findIndex(o=>o.correct)}"]`);
          if(correctBtn) correctBtn.classList.add('is-correct');
        }
        const fb = document.getElementById('feedback');
        fb.textContent = (opt.correct ? '✅ ' : '💡 ') + opt.feedback;
        fb.classList.add('show');
        if(opt.correct) fb.classList.add('correct');
        document.getElementById('next-btn').classList.add('show');
      });
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      current++;
      renderScenario();
    });
  }

  renderScenario();

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

  /* ---- Gekkoo Fladder (game) ---- */
