
(function(){
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function mark(el, classes, delay){
    if(!el) return;
    el.classList.add('arfa-reveal');
    (classes||[]).forEach(c=>el.classList.add(c));
    if(delay != null) el.style.setProperty('--arfa-delay', delay+'ms');
  }
  function addMotionTargets(){
    // Home hero: restore visible sequential reveal
    const hero = document.querySelector('.page-home .hero');
    if(hero){
      $$('.hero-copy > *', hero).forEach((el,i)=>mark(el,['reveal-rise'], i*80));
      $$('.hero-side > *', hero).forEach((el,i)=>mark(el,['reveal-right'], 180+i*120));
      $$('.hero-proof .proof-card', hero).forEach((el,i)=>mark(el,['reveal-pop'], 380+i*110));
    }
    // Dark room / evidence sections
    $$('.room-section .room-copy').forEach((el,i)=>mark(el,['reveal-left'],80));
    $$('.room-section .room-card').forEach((el,i)=>mark(el,['reveal-right'],i*110));
    $$('.room-section .immersive-quote').forEach((el,i)=>mark(el,['reveal-rise'],150));
    // Advisor / Professional Input - explicit per user
    const join = document.querySelector('#join');
    if(join){
      mark(join.querySelector('.join-grid > div:first-child'), ['reveal-left'], 0);
      $$('.join-step', join).forEach((el,i)=>mark(el,['reveal-left'],140+i*95));
      mark(join.querySelector('.form-shell'), ['reveal-rise'], 420);
      mark(join.querySelector('.side-actions'), ['reveal-right'], 180);
      $$('.side-card', join).forEach((el,i)=>mark(el,['reveal-right'],260+i*115));
    }
    // Home challenge gateway
    const ch = document.querySelector('.page-home #challenge');
    if(ch){
      mark(ch.querySelector('.challenge-copy'), ['reveal-left'], 0);
      $$('.challenge-points li', ch).forEach((el,i)=>mark(el,['reveal-left'],160+i*70));
      mark(ch.querySelector('.challenge-card'), ['reveal-right'], 280);
    }
    // Generic cards and panels not already targeted
    const generic = '.section-head, .panel, .card, .voice-card, .letter-card, .minimum-card, .path-card, .support-card, .source-card, .compare-card, .archive-card, .evidence-pill, .callout, .declaration-card, .logic-band, .precision-panel';
    $$(generic).forEach((el,i)=>{
      if(el.closest('.site-header') || el.closest('.site-footer')) return;
      if(!el.classList.contains('arfa-reveal') && !el.classList.contains('reveal')) mark(el,['reveal-rise'],Math.min((i%6)*45,240));
    });
    // Challenge page: left rail first, main follows
    if(document.body.classList.contains('challenge-page')){
      const sidebar = document.querySelector('aside.sidebar');
      mark(sidebar, ['challenge-left-first','reveal-left'], 0);
      $$('.sidebar .brand, .sidebar nav, .sidebar .stats, .sidebar .progress, .sidebar .toolbar').forEach((el,i)=>mark(el,['challenge-left-first','reveal-left'],80+i*100));
      $$('.challenge-main > .panel, .challenge-main > section, .challenge-main .hero-card, .challenge-main .info, .challenge-main .problem-card, .challenge-main .rubric-card, .challenge-main .faq-card, .challenge-main .select-card, .challenge-main .callout').forEach((el,i)=>{
        const cls = i < 2 ? ['challenge-main-follow','reveal-right'] : ['challenge-main-late','reveal-rise'];
        mark(el, cls, 380 + Math.min(i*75, 520));
      });
    }
  }
  function runReveal(){
    const items = $$('.reveal, .arfa-reveal');
    if(reduce){ items.forEach(el=>el.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -64px 0px'});
    items.forEach(el=>io.observe(el));
  }
  function progress(){
    const doc=document.documentElement;
    const max=doc.scrollHeight-doc.clientHeight;
    const pct=max>0?window.scrollY/max*100:0;
    doc.style.setProperty('--progress', pct.toFixed(2)+'%');
  }
  function setupParallax(){
    if(reduce) return;
    let ticking=false;
    const update=()=>{
      progress();
      const y=window.scrollY || 0;
      document.documentElement.style.setProperty('--arfa-scroll', y.toFixed(0));
      ticking=false;
    };
    window.addEventListener('scroll',()=>{ if(!ticking){ requestAnimationFrame(update); ticking=true; } },{passive:true});
    window.addEventListener('resize',update);
    update();
  }
  // Delay one frame so original script can finish, then apply final layer.
  requestAnimationFrame(()=>{ addMotionTargets(); runReveal(); setupParallax(); });
})();
