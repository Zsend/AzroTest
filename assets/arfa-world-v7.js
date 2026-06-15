(function(){
  'use strict';
  const doc = document;
  const root = doc.documentElement;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function mark(el, variant, delay){
    if(!el || el.closest('.site-header') || el.closest('.site-footer')) return;
    el.classList.add('reveal','arfa-reveal');
    if(variant) el.classList.add(variant);
    if(delay != null) el.style.setProperty('--arfa-delay', delay + 'ms');
  }
  function markAll(selector, variant, baseDelay, step, scope){
    Array.from((scope || doc).querySelectorAll(selector)).forEach(function(el, i){ mark(el, variant, (baseDelay||0) + i*(step||70)); });
  }

  function pageClass(){
    const path = location.pathname;
    if(/unusual-thinkers/.test(path)) doc.body.classList.add('challenge-page');
    else if(/letters/.test(path)) doc.body.classList.add('letters-page');
    else if(/national-scale/.test(path)) doc.body.classList.add('national-page');
    else if(/standard/.test(path)) doc.body.classList.add('standard-page');
    else if(/sustainability/.test(path)) doc.body.classList.add('sustainability-page');
    else if(/sources/.test(path)) doc.body.classList.add('sources-page');
    else doc.body.classList.add('home-page');
  }

  function setupRevealTargets(){
    // Home hero: individual choreography, not a single block fade.
    markAll('.hero-copy > .eyebrow', 'reveal-left', 0, 0);
    markAll('.hero-copy > h1, .hero-copy > .lead, .hero-copy > .support-line', 'reveal-left', 90, 110);
    markAll('.hero-copy .hero-truths span', 'reveal-up', 430, 45);
    markAll('.hero-copy .cta-row > *', 'reveal-up', 620, 65);
    markAll('.hero-copy .hero-proof > *', 'reveal-up', 760, 75);
    markAll('.hero-side > *', 'reveal-right', 250, 140);

    // Core page sections and cards.
    markAll('.declaration-card, .section-head, .letters-quote, .letter-collage, .large-collage, .minimum-band, .logic-band, .callout, .precision-panel, .immersive-quote', 'reveal-soft', 0, 90);
    markAll('.room-copy, .room-card, .compare-card, .voice-card, .letter-card, .archive-card, .minimum-card, .path-card, .support-card, .source-card, .proof-card, .evidence-pill, .card, .archive-link, .paper', 'reveal-up', 0, 55);

    // Advisor/professional input section: explicit left/right sequence.
    const join = doc.querySelector('#join');
    if(join){
      markAll('.join-label, .join h2, .join-grid > div:first-child > p:not(.join-label)', 'reveal-left', 0, 120, join);
      markAll('.join-step', 'reveal-left', 360, 110, join);
      markAll('.form-shell', 'reveal-left', 760, 0, join);
      markAll('.side-card', 'reveal-right', 180, 135, join);
    }

    // Home challenge gateway.
    markAll('.challenge-shell .challenge-copy > *, .challenge-shell .challenge-card', 'reveal-up', 0, 95);

    // Challenge page: left rail first, main later.
    if(doc.body.classList.contains('challenge-page')){
      const aside = doc.querySelector('aside.sidebar');
      const main = doc.querySelector('main');
      if(aside){
        mark(aside, 'reveal-left', 0);
        markAll('.brand, nav a, .stats, .progress, .toolbar', 'reveal-left', 70, 65, aside);
      }
      if(main){
        markAll('main > .panel', 'reveal-right', 360, 120);
        markAll('main .hero-card, main .info, main .card, main .problem-card, main .rubric-card, main .faq-card, main .select-card, main .callout, main .field, main details', 'reveal-up', 520, 45);
      }
    }
  }

  function setupRevealObserver(){
    const items = Array.from(doc.querySelectorAll('.arfa-reveal, .reveal'));
    if(!items.length) return;
    if(reduce){ items.forEach(function(el){ el.classList.add('is-visible'); }); return; }
    const io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -7% 0px'});
    items.forEach(function(el){
      el.classList.remove('is-visible');
      io.observe(el);
    });
  }

  function setupScrollFloat(){
    const floaters = Array.from(doc.querySelectorAll('.hero-side .photo-card, .hero-side .thesis-card, .letter-collage, .large-collage, .immersive-quote, .letters-quote'));
    floaters.forEach(function(el){ el.classList.add('scroll-float'); });
    if(reduce) return;
    let ticking = false;
    function update(){
      ticking = false;
      const h = innerHeight || 1;
      floaters.forEach(function(el, i){
        const r = el.getBoundingClientRect();
        const center = (r.top + r.height/2) / h;
        const offset = clamp((0.5 - center) * (i%2 ? 18 : 14), -18, 18);
        el.style.setProperty('--scroll-float', offset.toFixed(2) + 'px');
      });
    }
    function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
    update();
    addEventListener('scroll', onScroll, {passive:true});
    addEventListener('resize', onScroll);
  }

  function setupChallengeLead(){
    if(!doc.body.classList.contains('challenge-page') || reduce) return;
    const shell = doc.querySelector('.shell');
    const main = doc.querySelector('main');
    if(!shell || !main) return;
    let ticking = false;
    function update(){
      ticking = false;
      if(innerWidth < 981){ root.style.setProperty('--challenge-seq','1'); return; }
      const rect = shell.getBoundingClientRect();
      const start = Math.min(0, rect.top - 120);
      const lead = Math.max(260, Math.min(620, (doc.querySelector('aside.sidebar')?.offsetHeight || 520) * .55));
      const progress = clamp((-start) / lead, 0, 1);
      root.style.setProperty('--challenge-seq', progress.toFixed(3));
    }
    function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(update); } }
    update();
    addEventListener('scroll', onScroll, {passive:true});
    addEventListener('resize', onScroll);
  }

  pageClass();
  setupRevealTargets();
  setupRevealObserver();
  setupScrollFloat();
  setupChallengeLead();
  doc.body.classList.add('arfa-motion-ready');
})();
