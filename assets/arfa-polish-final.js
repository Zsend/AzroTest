
(function(){
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function mark(el, kind, delay){
    if(!el || el.dataset.arfaMotion) return;
    el.dataset.arfaMotion = 'true';
    if(kind) el.dataset.motionKind = kind;
    if(delay) el.style.setProperty('--motion-delay', delay + 'ms');
  }
  function stagger(list, kind, step, start){
    qsa(list).forEach(function(el, i){ mark(el, kind, (start || 0) + i * (step || 70)); });
  }
  function setupTargets(){
    // Hero and public page heads.
    stagger('.hero-copy .eyebrow, .hero-copy h1, .hero-copy .lead, .hero-copy .support-line, .hero-copy .hero-truths > *, .hero-copy .cta-row > *, .hero-proof > *', 'hero', 70, 0);
    stagger('.hero-side > *, .hero-photo-card .photo-wrap, .hero-photo-card .photo-copy, .hero-photo-card .thesis-list > *', 'right', 85, 120);
    stagger('.page-hero .breadcrumbs, .page-hero .section-label, .page-hero .page-title, .page-hero .page-lead, .page-hero .cta-row > *', 'hero', 70, 0);

    // General pages and cards.
    stagger('.section-head > *, .compact-section-head > *', 'hero', 70, 0);
    stagger('.card, .proof-card, .support-card, .compare-card, .path-card, .minimum-card, .archive-card, .source-card, .voice-card, .room-card, .challenge-card, .archive-link, .roadmap-card, .letter-card, .faq-card, .rubric-card, .problem-card, .select-card, .evidence-pill, .logic-pill, .callout, .declaration-card, .precision-panel, .builders-note, .minimum-band', 'card', 60, 60);
    stagger('.immersive-quote, .letters-quote, blockquote, .quote-card', 'quote', 70, 80);
    stagger('.letter-collage, .letter-collage img, .archive-thumb, .preview-card', 'right', 70, 120);

    // Inside section: preserve the strong sticky + card reveal feel.
    stagger('.room-copy, .room-copy > *, .room-note', 'left', 75, 0);
    stagger('.room-stack > *, .room-card, .immersive-quote', 'card', 95, 160);

    // Advisor/professional input: explicit requested choreography.
    stagger('#join .join-label, #join h2, #join .join-grid > div > p, #join .join-step, #join .form-shell', 'left', 90, 0);
    stagger('#join .side-actions > .side-card', 'right', 125, 240);

    // Challenge page: left rail leads first; main follows.
    stagger('.challenge-page aside, .challenge-page aside .brand, .challenge-page aside nav a, .challenge-page aside .stat, .challenge-page aside .progress, .challenge-page aside .toolbar > *', 'left', 55, 0);
    stagger('.challenge-page main > .panel, .challenge-page main .hero > *, .challenge-page main .hero-card, .challenge-page main .info, .challenge-page main .card, .challenge-page main .problem-card, .challenge-page main .rubric-card, .challenge-page main .faq-card, .challenge-page main .select-card, .challenge-page main .callout', 'card', 80, 420);
  }
  function revealFallback(){ qsa('[data-arfa-motion]').forEach(function(el){el.classList.add('arfa-inview');}); }
  function setupObserver(){
    if(reduce || !('IntersectionObserver' in window)){ revealFallback(); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('arfa-inview');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.1, rootMargin:'0px 0px -8% 0px'});
    qsa('[data-arfa-motion]').forEach(function(el){ io.observe(el); });
  }
  function setupScrollProgress(){
    function update(){
      var max = Math.max(1, doc.scrollHeight - doc.clientHeight);
      doc.style.setProperty('--progress', ((window.scrollY / max) * 100).toFixed(2) + '%');
      // Small continuous parallax only on visible hero/media objects, not text blocks.
      qsa('.arfa-inview.hero-photo-card, .arfa-inview.letter-collage, .arfa-inview.photo-card').forEach(function(el){
        var r = el.getBoundingClientRect();
        var center = r.top + r.height/2;
        var p = (center - window.innerHeight/2) / window.innerHeight;
        var y = Math.max(-12, Math.min(12, p * -18));
        el.style.setProperty('--motion-parallax', y.toFixed(1)+'px');
      });
    }
    update();
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
  }
  function init(){
    setupTargets();
    doc.classList.add('arfa-motion-ready');
    setupObserver();
    setupScrollProgress();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
