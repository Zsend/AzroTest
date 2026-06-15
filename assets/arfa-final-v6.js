(function(){
  'use strict';
  const d = document;
  const w = window;
  const reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isChallenge(){ return /\/unusual-thinkers\//.test(location.pathname) || d.body.querySelector('.shell > aside.sidebar'); }

  function markGlobalMotion(){
    const groups = [
      {sel:'.hero-copy .eyebrow, .hero-copy h1, .hero-copy .lead, .hero-copy .support-line, .hero-copy .hero-truths, .hero-copy .cta-row, .hero-copy .hero-proof .proof-card', variant:'motion-left'},
      {sel:'.hero-side .photo-card, .hero-side .thesis-card', variant:'motion-right'},
      {sel:'#inside .room-copy, #inside .room-card, #inside .immersive-quote', variant:'motion-left'},
      {sel:'#letters .section-head, #letters .letters-quote, #letters .letter-collage, #letters .voice-card, #letters .evidence-pill, #letters .letter-card', variant:'motion-soft'},
      {sel:'#minimum .minimum-card, #minimum .minimum-band, #path .path-card, #workbook .card, #join .join-copy, #join .join-step, #join .form-grid, #join .side-card, .challenge-shell, .challenge-shell .challenge-copy, .challenge-shell .challenge-card', variant:'motion-soft'},
      {sel:'.page-hero .eyebrow, .page-hero h1, .page-hero .page-lead, .page-hero .cta-row, .page-hero .large-collage, .archive-card, .source-card, .declaration-card, .support-card, .card, .minimum-card, .path-card, .precision-panel, .callout, .panel', variant:'motion-soft'}
    ];
    let all = [];
    groups.forEach(group => {
      d.querySelectorAll(group.sel).forEach(el => {
        if(el.closest('.site-header') || el.closest('.site-footer')) return;
        if(el.classList.contains('motion-reveal')) return;
        el.classList.add('motion-reveal');
        el.classList.add(group.variant || 'motion-soft');
        all.push(el);
      });
    });
    // Stagger siblings and high-density groups.
    const containers = ['.hero-copy','.hero-side','#inside','.room-grid','#letters','.letter-grid','#join .join-grid','#join .join-steps','#join .join-actions','.challenge-shell','.archive-grid','.sources-list','.vision-grid','.path-grid'];
    containers.forEach(sel => {
      d.querySelectorAll(sel).forEach(box => {
        Array.from(box.querySelectorAll('.motion-reveal')).forEach((el,i)=>el.style.setProperty('--motion-delay', Math.min(i*70,420)+'ms'));
      });
    });
  }

  function setupReveal(){
    const items = Array.from(d.querySelectorAll('.motion-reveal'));
    if(!items.length) return;
    if(reduce){ items.forEach(el => el.classList.add('is-visible')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.11, rootMargin:'0px 0px -8% 0px'});
    items.forEach(el => io.observe(el));
  }

  function setupParallax(){
    const elems = Array.from(d.querySelectorAll('.hero-photo-card, .thesis-card, .letter-collage, .large-collage, .immersive-quote, .challenge-shell'));
    elems.forEach(el => el.classList.add('motion-parallax'));
    if(reduce || !elems.length) return;
    let ticking = false;
    function update(){
      const vh = w.innerHeight || 1;
      elems.forEach(el => {
        const r = el.getBoundingClientRect();
        const center = r.top + r.height/2;
        const norm = (center - vh/2) / vh;
        const shift = Math.max(-18, Math.min(18, norm * -18));
        el.style.setProperty('--parallax-y', shift.toFixed(2));
      });
      ticking = false;
    }
    function request(){ if(!ticking){ ticking = true; w.requestAnimationFrame(update); } }
    update();
    w.addEventListener('scroll', request, {passive:true});
    w.addEventListener('resize', request);
  }

  function setupProgress(){
    function update(){
      const doc = d.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (w.scrollY/max)*100 : 0;
      doc.style.setProperty('--progress', pct.toFixed(2)+'%');
    }
    update();
    w.addEventListener('scroll', update, {passive:true});
    w.addEventListener('resize', update);
  }

  function setupChallengeSequence(){
    const shell = d.querySelector('.shell');
    if(!shell || !d.querySelector('aside.sidebar') || !d.querySelector('main#main')) return;
    d.body.classList.add('challenge-page');
    // Wrap aside + main once for sticky sequencing.
    let sticky = shell.querySelector(':scope > .challenge-sticky');
    if(!sticky){
      sticky = d.createElement('div');
      sticky.className = 'challenge-sticky';
      const kids = Array.from(shell.children);
      kids.forEach(k => sticky.appendChild(k));
      shell.appendChild(sticky);
    }
    shell.classList.add('challenge-sequence');
    const left = sticky.querySelector('aside.sidebar');
    const main = sticky.querySelector('main#main');
    if(!left || !main) return;

    // Add reveal classes left-first, main-following.
    Array.from(left.querySelectorAll('.brand, nav a, .stat, .toolbar > *')).forEach((el,i)=>{
      el.classList.add('motion-reveal','motion-left');
      el.style.setProperty('--motion-delay', Math.min(i*45,360)+'ms');
    });
    Array.from(main.querySelectorAll('.panel, .hero-card, .info, .card, .problem-card, .rubric-card, .faq-card, .select-card, .callout, .field, .track-choice')).forEach((el,i)=>{
      if(!el.classList.contains('motion-reveal')) el.classList.add('motion-reveal','motion-right');
      el.style.setProperty('--motion-delay', Math.min(220 + (i%8)*55,620)+'ms');
    });

    let state = {enabled:false, top:88, view:0, leftOverflow:0, mainOverflow:0, total:0};
    function measure(){
      const desktop = w.innerWidth >= 1081 && !reduce;
      state.enabled = desktop;
      if(!desktop){
        shell.style.removeProperty('--challenge-seq-height');
        shell.style.removeProperty('--challenge-left-shift');
        shell.style.removeProperty('--challenge-main-shift');
        return;
      }
      const topVal = parseFloat(getComputedStyle(sticky).top) || 88;
      state.top = topVal;
      state.view = Math.max(580, (w.innerHeight || 900) - topVal);
      // Natural content heights before transforms.
      const leftH = left.scrollHeight;
      const mainH = main.scrollHeight;
      state.leftOverflow = Math.max(0, leftH - state.view);
      state.mainOverflow = Math.max(0, mainH - state.view);
      // If left barely overflows, still give it a short lead phase through reveal, but don't over-translate.
      state.total = state.leftOverflow + state.mainOverflow;
      const seqHeight = state.view + state.total + 2;
      shell.style.setProperty('--challenge-seq-height', seqHeight + 'px');
      updateChallenge();
    }
    let raf = false;
    function updateChallenge(){
      if(!state.enabled){ raf = false; return; }
      const rect = shell.getBoundingClientRect();
      const progress = Math.min(Math.max(state.top - rect.top, 0), state.total);
      const leftShift = Math.min(progress, state.leftOverflow);
      const mainShift = Math.min(Math.max(progress - state.leftOverflow, 0), state.mainOverflow);
      shell.style.setProperty('--challenge-left-shift', leftShift.toFixed(2));
      shell.style.setProperty('--challenge-main-shift', mainShift.toFixed(2));
      raf = false;
    }
    function requestUpdate(){ if(!raf){ raf = true; w.requestAnimationFrame(updateChallenge); } }
    // Ensure measurements happen after layout/fonts/images.
    measure();
    w.addEventListener('load', measure);
    w.addEventListener('resize', measure);
    w.addEventListener('scroll', requestUpdate, {passive:true});
    if('ResizeObserver' in w){
      const ro = new ResizeObserver(measure); ro.observe(left); ro.observe(main);
    }
  }

  function init(){
    d.documentElement.classList.add('arfa-final-motion');
    markGlobalMotion();
    setupChallengeSequence();
    setupReveal();
    setupParallax();
    setupProgress();
  }

  if(d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})();
