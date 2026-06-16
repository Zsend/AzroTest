(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function markRevealTargets(){
    const selectors = [
      '.section-head', '.minimum-card', '.support-card', '.builders-grid .card', '.compare-card',
      '.challenge-copy', '.challenge-side', '.join .section-label', '.join h2', '.join-copy > p',
      '.join-step', '.form-shell', '.side-card', '.letters-quote', '.letter-collage', '.voice-card',
      '.evidence-pill', '.minimum-band', '.deep-dive', '.archive-link', '.immersive-quote'
    ].join(',');
    document.querySelectorAll(selectors).forEach(el=>{
      if(el.closest('.site-header') || el.closest('.site-footer')) return;
      el.classList.add('reveal');
    });
  }

  function reveal(){
    const els = Array.from(document.querySelectorAll('.reveal,[data-reveal]'));
    if(reduce){ els.forEach(el=>el.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    },{threshold:.12, rootMargin:'0px 0px -7% 0px'});
    els.forEach(el=>io.observe(el));
  }

  function progress(){
    const update=()=>{
      const d=document.documentElement; const max=d.scrollHeight-d.clientHeight;
      d.style.setProperty('--progress', max>0 ? ((scrollY/max)*100).toFixed(2)+'%' : '0%');
      const parallaxTargets=document.querySelectorAll('.room-section,.join,.challenge-shell,.hero-photo-card');
      parallaxTargets.forEach(el=>{
        const r=el.getBoundingClientRect(); const vh=innerHeight||1;
        const p=Math.max(-1,Math.min(1,(vh/2-(r.top+r.height/2))/vh));
        el.style.setProperty('--parallax',(p*28).toFixed(2)+'px');
      });
    };
    update(); addEventListener('scroll',update,{passive:true}); addEventListener('resize',update);
  }

  markRevealTargets();
  reveal();
  progress();
})();
