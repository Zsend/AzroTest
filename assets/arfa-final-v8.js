(function(){
  'use strict';
  const d=document, root=d.documentElement;
  const reduce=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function qsa(sel,scope=d){return Array.from(scope.querySelectorAll(sel));}
  function mark(el, kind='motion-up', delay=0){
    if(!el || el.closest('.site-header') || el.closest('.site-footer')) return;
    el.classList.add('arfa-motion-item', kind, 'view-motion');
    el.style.setProperty('--motion-delay', delay+'ms');
  }
  function markAll(sel, kind='motion-up', base=0, step=70, scope=d){qsa(sel,scope).forEach((el,i)=>mark(el,kind,base+i*step));}
  function pageClass(){
    const path=location.pathname;
    if(/unusual-thinkers/.test(path)) d.body.classList.add('challenge-page');
    else if(/letters/.test(path)) d.body.classList.add('letters-page');
    else if(/national-scale/.test(path)) d.body.classList.add('national-page');
    else if(/standard/.test(path)) d.body.classList.add('standard-page');
    else if(/sustainability/.test(path)) d.body.classList.add('sustainability-page');
    else if(/sources/.test(path)) d.body.classList.add('sources-page');
    else d.body.classList.add('home-page');
  }
  function markTargets(){
    markAll('.hero-copy > .eyebrow', 'motion-left', 0, 0);
    markAll('.hero-copy > h1, .hero-copy > .lead, .hero-copy > .support-line', 'motion-left', 90, 110);
    markAll('.hero-copy .hero-truths span', 'motion-up', 420, 45);
    markAll('.hero-copy .cta-row > *', 'motion-up', 610, 65);
    markAll('.hero-copy .hero-proof > *', 'motion-up', 750, 75);
    markAll('.hero-side > *', 'motion-right', 220, 145);

    markAll('.section-head, .declaration-card, .minimum-band, .logic-band, .callout, .precision-panel, .immersive-quote, .letters-quote, .letter-collage, .large-collage', 'motion-soft', 0, 85);
    markAll('.room-copy', 'motion-left', 0, 0);
    markAll('.room-card', 'motion-right', 120, 130);
    markAll('.voice-card, .letter-card, .archive-card, .minimum-card, .path-card, .support-card, .source-card, .proof-card, .evidence-pill, .card, .archive-link, .paper, .compare-card', 'motion-up', 0, 55);

    const join=d.querySelector('#join');
    if(join){
      markAll('.join-label, .join h2, .join-copy > p:not(.join-label)', 'motion-left', 0, 120, join);
      markAll('.join-step', 'motion-left', 360, 120, join);
      markAll('.form-shell', 'motion-left', 760, 0, join);
      markAll('.side-card', 'motion-right', 180, 145, join);
    }
    markAll('.challenge-shell .challenge-copy > *, .challenge-shell .challenge-card', 'motion-up', 0, 95);

    if(d.body.classList.contains('challenge-page')){
      const aside=d.querySelector('aside.sidebar');
      const main=d.querySelector('main');
      if(aside){
        mark(aside, 'motion-left', 0);
        markAll('.brand, nav a, .stats, .progress, .toolbar', 'motion-left', 80, 65, aside);
      }
      if(main){
        markAll('main > .panel', 'motion-right', 460, 125, main);
        markAll('main .hero-card, main .info, main .card, main .problem-card, main .rubric-card, main .faq-card, main .select-card, main .callout, main .field, main details', 'motion-up', 650, 45, main);
      }
    }
  }
  function revealObserver(){
    const els=qsa('.arfa-motion-item, .reveal, .challenge-reveal');
    if(!els.length) return;
    if(reduce){els.forEach(el=>el.classList.add('is-visible')); return;}
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('is-visible'); io.unobserve(entry.target);}
      });
    },{threshold:.1,rootMargin:'0px 0px -8% 0px'});
    els.forEach(el=>{el.classList.remove('is-visible'); io.observe(el);});
  }
  function scrollFloat(){
    const els=qsa('.hero-side .photo-card, .hero-side .thesis-card, .letter-collage, .large-collage, .immersive-quote, .letters-quote');
    els.forEach(el=>el.classList.add('scroll-float'));
    if(reduce) return;
    let tick=false;
    function update(){
      tick=false; const h=innerHeight||1;
      els.forEach((el,i)=>{
        const r=el.getBoundingClientRect(); const center=(r.top+r.height/2)/h;
        const offset=clamp((0.5-center)*(i%2?18:14),-18,18);
        el.style.setProperty('--scroll-float', offset.toFixed(2)+'px');
      });
    }
    function on(){if(!tick){tick=true;requestAnimationFrame(update);}}
    update(); addEventListener('scroll',on,{passive:true}); addEventListener('resize',on);
  }
  function challengeSequence(){
    if(!d.body.classList.contains('challenge-page')||reduce) return;
    const shell=d.querySelector('.shell'), aside=d.querySelector('aside.sidebar'), main=d.querySelector('main');
    if(!shell||!aside||!main) return;
    let tick=false;
    function update(){
      tick=false;
      if(innerWidth<981){
        root.style.setProperty('--challenge-main-progress','1');
        root.style.setProperty('--challenge-main-lock','0px');
        return;
      }
      const rect=shell.getBoundingClientRect();
      const sidebarH=aside.offsetHeight||680;
      // The left rail leads: while the first portion of the shell scrolls, offset main by the same amount
      // so the right side visually holds. After the rail has had room to pass, the main content begins moving.
      const lead=Math.max(460, Math.min(920, sidebarH*.82));
      const scrolled=Math.max(0, 112-rect.top);
      const locked=clamp(scrolled,0,lead);
      const progress=clamp((scrolled-lead*.12)/(lead*.88),0,1);
      root.style.setProperty('--challenge-main-lock', locked.toFixed(1)+'px');
      root.style.setProperty('--challenge-main-progress', progress.toFixed(3));
    }
    function on(){if(!tick){tick=true;requestAnimationFrame(update);}}
    update(); addEventListener('scroll',on,{passive:true}); addEventListener('resize',on);
  }

  function joinSequence(){
    const join=d.querySelector('#join');
    if(!join||reduce) return;
    let tick=false;
    function update(){
      tick=false;
      const r=join.getBoundingClientRect();
      const h=innerHeight||1;
      const progress=clamp((h-r.top)/(h+r.height*.35),0,1);
      join.style.setProperty('--join-progress',progress.toFixed(3));
      join.classList.toggle('is-join-active', progress>0.05 && progress<0.98);
    }
    function on(){if(!tick){tick=true;requestAnimationFrame(update);}}
    update(); addEventListener('scroll',on,{passive:true}); addEventListener('resize',on);
  }
  pageClass();
  markTargets();
  revealObserver();
  scrollFloat();
  challengeSequence();
  joinSequence();
  d.body.classList.add('arfa-final-motion-v8');
})();
