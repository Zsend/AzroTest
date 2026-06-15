
(function(){
  'use strict';
  const root=document.documentElement;
  root.classList.add('arfa-motion-ready');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const qsa=(sel,el=document)=>Array.from(el.querySelectorAll(sel));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function mark(el,kind='fx-rise',delay=0,drift='soft'){
    if(!el || el.classList.contains('fx')) return;
    el.classList.add('fx',kind,'fx-scroll');
    el.style.setProperty('--fx-delay', delay+'ms');
    if(drift) el.setAttribute('data-fx-drift', drift);
    if(el.matches('.proof-card,.card,.support-card,.minimum-card,.path-card,.source-card,.archive-card,.letter-card,.compare-card,.voice-card,.room-card,.panel,.challenge-card,.thesis-card,.form-shell,.side-card,.archive-link')) el.classList.add('fx-card-hover');
  }
  function buildMotion(){
    qsa('.hero').forEach(hero=>{
      const left=qsa('.eyebrow,.section-label,h1,.page-title,.lead,.support-line,.hero-truths span,.cta-row > *,.hero-proof > *',hero);
      left.forEach((el,i)=>mark(el, i<4?'fx-left':(i%3===0?'fx-pop':'fx-rise'), Math.min(i,14)*70, el.matches('.proof-card')?'card':'soft'));
      qsa('.hero-side,.photo-card,.photo-wrap,.hero-photo-frame,.photo-copy,.hero-photo-caption,.evidence-footer,.thesis-card',hero).forEach((el,i)=>mark(el,'fx-right',160+i*95, el.matches('.photo-card,.photo-wrap,.hero-photo-frame')?'image':'card'));
    });
    const groups=[
      ['.declaration-card','fx-pop'],
      ['.section-head,.compact-section-head,.page-hero .eyebrow,.page-hero .section-label,.page-hero h1,.page-hero h2,.page-lead','fx-soft'],
      ['.room-copy,.letters-quote,.join h2,.join p,.standard-clause,.funding-disclaimer','fx-left'],
      ['.room-stack > *,.compare-card,.minimum-card,.support-card,.path-card,.source-card,.archive-card,.letter-card,.voice-card,.public-record-grid > *,.evidence-grid > *,.vision-grid > *,.builders-grid > *,.card,.proof-card','fx-rise'],
      ['.immersive-quote,.logic-band,.callout,.declaration-card,.minimum-band,.copy-panel','fx-pop'],
      ['.letter-collage,.letters-showcase .large-collage,.archive-hero-grid .letter-collage,.side-card,.form-shell','fx-right'],
      ['.join-step,.join .side-card,.form-shell .field,.form-shell .btn,.challenge-shell,.challenge-copy,.challenge-card,.challenge-mini','fx-rise']
    ];
    groups.forEach(([sel,kind],g)=>qsa(sel).forEach((el,i)=>mark(el,kind,Math.min((i+g)%10,9)*55, el.matches('.letter-collage,.large-collage')?'image':(el.matches('.card,.proof-card,.support-card,.minimum-card,.path-card,.source-card,.archive-card,.letter-card,.compare-card,.voice-card,.room-card,.challenge-card,.side-card,.form-shell')?'card':'soft'))));
  }
  function observeMotion(){
    const items=qsa('.fx');
    if(reduce){items.forEach(el=>el.classList.add('fx-in'));return;}
    const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('fx-in');io.unobserve(entry.target);}});},{threshold:.08,rootMargin:'0px 0px -7% 0px'});
    items.forEach(el=>io.observe(el));
    // Run first-screen choreography on load. This restores the obvious hero motion.
    setTimeout(()=>qsa('.hero .fx').forEach(el=>{if(el.getBoundingClientRect().top < innerHeight*.98) el.classList.add('fx-in')}),120);
  }
  function driftMotion(){
    if(reduce) return;
    const moving=qsa('[data-fx-drift]');
    let ticking=false;
    function update(){
      const vh=innerHeight||800;
      moving.forEach(el=>{
        const r=el.getBoundingClientRect(); if(r.bottom<-260||r.top>vh+260) return;
        const ratio=clamp(((r.top+r.height/2)-vh/2)/(vh/2),-1,1);
        const type=el.getAttribute('data-fx-drift');
        const amp=type==='image'?-14:(type==='card'?8:5);
        el.style.setProperty('--fx-drift',(ratio*amp).toFixed(2)+'px');
      });
      ticking=false;
    }
    function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(update)}}
    update(); addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll);
  }
  buildMotion(); observeMotion(); driftMotion();
})();
