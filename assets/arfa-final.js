
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $all = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const addMotion = (els, cls='arfa-up', startDelay=0, step=70) => {
    els.forEach((el, i) => {
      if(!el || el.closest('.site-header') || el.closest('.site-footer')) return;
      el.classList.add('arfa-motion', cls);
      el.style.setProperty('--arfa-delay', (startDelay + i*step) + 'ms');
    });
  };

  // Page identity
  if(location.pathname.includes('/unusual-thinkers/')) document.body.classList.add('challenge-page');
  if(location.pathname.includes('/standard/')) document.body.classList.add('standard-page');
  if(location.pathname.includes('/sustainability/')) document.body.classList.add('sustainability-page');
  if(location.pathname.includes('/national-scale/')) document.body.classList.add('national-scale-page');

  // Global motion targets, deliberately broad but controlled.
  addMotion($all('.page-hero .eyebrow, .page-hero h1, .page-hero .page-lead, .page-hero .lead, .hero-copy .eyebrow, .hero-copy h1, .hero-copy .lead, .hero-copy .support-line'), 'arfa-left', 0, 75);
  addMotion($all('.hero-truths > *, .cta-row > *, .hero-proof > *'), 'arfa-up', 120, 70);
  addMotion($all('.hero-side > *, .hero-photo-frame, .hero-photo-caption, .evidence-footer > *'), 'arfa-right', 80, 85);
  addMotion($all('.room-copy, .room-note, .room-stack > *, .immersive-quote, .voice-card, .compare-card, .minimum-card, .path-card, .support-card, .archive-card, .source-card, .proof-card, .letter-card, .public-record-grid > *, .evidence-grid > *, .sources-grid > *, .builders-grid > *, .section-head, .panel'), 'arfa-up', 0, 55);
  addMotion($all('#join .join-label, #join h2, #join .join-grid > div:first-child > p, #join .join-step, #join .form-shell'), 'arfa-left', 0, 90);
  addMotion($all('#join .side-card'), 'arfa-right', 140, 120);
  addMotion($all('.challenge-shell .challenge-copy > *, .challenge-shell .challenge-points > *'), 'arfa-left', 0, 80);
  addMotion($all('.challenge-shell .challenge-card'), 'arfa-right', 180, 90);

  // Challenge page: left rail leads first, main follows. No fake background stamping.
  if(document.body.classList.contains('challenge-page')){
    const railItems = $all('aside .brand, aside nav a, aside .stat, aside .progress, aside .toolbar > *');
    railItems.forEach((el,i)=>{
      el.classList.add('arfa-motion','arfa-left','challenge-rail-motion');
      el.style.setProperty('--arfa-delay', (i*58)+'ms');
    });
    const mainItems = $all('main .panel, main .hero .mini-kicker, main .hero h2, main .hero .lead, main .pill, main .hero-card, main .info, main .card, main .problem-card, main .rubric-card, main .faq-card, main .select-card, main .callout, main .field, main .toolbar > *');
    mainItems.forEach((el,i)=>{
      el.classList.add('arfa-motion','arfa-up','challenge-main-motion');
      el.style.setProperty('--arfa-delay', (260 + i*36)+'ms');
    });
  }

  const motionItems = $all('.arfa-motion');
  if(reduce){
    motionItems.forEach(el => el.classList.add('arfa-visible','is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('arfa-visible','is-visible');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.13, rootMargin:'0px 0px -46px 0px'});
  motionItems.forEach(el=>io.observe(el));

  // Lightweight scroll progress for header/progression only; do not transform major layout continuously.
  const updateProgress=()=>{
    const d=document.documentElement;
    const max=Math.max(1,d.scrollHeight-d.clientHeight);
    d.style.setProperty('--progress', ((window.scrollY/max)*100).toFixed(2)+'%');
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, {passive:true});
  window.addEventListener('resize', updateProgress);

  // Desktop challenge scrollytelling: the left rail scrolls/reveals first without its own scrollbar,
  // then the main/right content releases and continues naturally.
  function setupChallengeStage(){
    if(!document.body.classList.contains('challenge-page')) return;
    const shell=document.querySelector('.shell');
    const sidebar=document.querySelector('.sidebar');
    const inner=document.querySelector('.sidebar-inner');
    const main=document.querySelector('main');
    if(!shell||!sidebar||!inner||!main) return;
    const mq=window.matchMedia('(min-width:1081px)');
    let maxShift=0, start=0, end=0;
    const measure=()=>{
      if(!mq.matches){
        document.documentElement.style.setProperty('--challenge-left-y','0px');
        document.documentElement.style.setProperty('--challenge-main-y','0px');
        document.documentElement.style.setProperty('--challenge-main-opacity','1');
        return;
      }
      const sidebarBox=sidebar.getBoundingClientRect();
      const visible=Math.max(320, window.innerHeight-128);
      maxShift=Math.max(0, inner.scrollHeight-visible);
      const rect=shell.getBoundingClientRect();
      start=window.scrollY + rect.top - 115;
      // first phase has enough distance for the left rail to travel; then main is released.
      end=start + Math.max(360, Math.min(780, maxShift + 360));
      update();
    };
    const update=()=>{
      if(!mq.matches) return;
      const y=window.scrollY;
      const denom=Math.max(1,end-start);
      const p=Math.max(0,Math.min(1,(y-start)/denom));
      const leftPhase=Math.max(0,Math.min(1,p/.58));
      const mainPhase=Math.max(0,Math.min(1,(p-.42)/.58));
      const shift=-(maxShift*leftPhase);
      document.documentElement.style.setProperty('--challenge-left-y',shift.toFixed(1)+'px');
      document.documentElement.style.setProperty('--challenge-main-progress',mainPhase.toFixed(3));
      document.documentElement.style.setProperty('--challenge-main-y',((1-mainPhase)*30).toFixed(1)+'px');
      document.documentElement.style.setProperty('--challenge-main-opacity',(0.72+mainPhase*.28).toFixed(3));
    };
    measure();
    window.addEventListener('resize',measure,{passive:true});
    window.addEventListener('scroll',update,{passive:true});
  }
  setupChallengeStage();

})();
