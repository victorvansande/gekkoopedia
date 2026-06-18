  /* ---- Regio-ondersteuners: codeslot + bestanden ----
     Belangrijk: dit slot draait volledig in de browser en is GEEN echte beveiliging.
     De code en de inhoud zitten in de paginabron en zijn dus zichtbaar voor wie wil.
     Gebruik dit als lichte drempel/UX, niet voor echt vertrouwelijke documenten. */

  (function(){
    const TEST_CODE = '1234'; // Verander dit naar jouw eigen code

    function openRegioPdf(){
      window.open('regio.pdf', '_blank');
    }
    let unlocked = false;
    const lock = document.getElementById('regio-lock');
    const content = document.getElementById('regio-content');
    const input = document.getElementById('regio-code');
    const btn = document.getElementById('regio-unlock-btn');
    const fb = document.getElementById('regio-feedback');
    if(!lock || !content) return;

    function applyState(){
      lock.hidden = unlocked;
      content.hidden = !unlocked;
      if(!unlocked){ input.value = ''; fb.textContent = ''; fb.className = 'lock-feedback'; }
    }
    function tryUnlock(){
      if((input.value || '').trim() === TEST_CODE){
        unlocked = true;
        applyState();
        if(typeof launchConfetti === 'function') launchConfetti();
      } else {
        fb.textContent = 'Onjuiste code, probeer opnieuw.';
        fb.className = 'lock-feedback err';
        lock.classList.remove('shake');
        requestAnimationFrame(() => lock.classList.add('shake'));
        input.select();
      }
    }
    btn.addEventListener('click', tryUnlock);
    input.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); tryUnlock(); } });
    lock.addEventListener('animationend', () => lock.classList.remove('shake'));

    const relock = document.getElementById('regio-relock');
    if(relock) relock.addEventListener('click', () => { unlocked = false; applyState(); });

    const pdfCard = document.getElementById('regio-pdf-card');
    if(pdfCard) pdfCard.addEventListener('click', e => { e.preventDefault(); openRegioPdf(); });

    // Door showView aangeroepen bij het openen van dit onderdeel
    window.__applyRegioState = applyState;
    applyState();
  })();
