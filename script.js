/* Cursor-reactive glow for Gumroad button (desktop pointers) */
if (window.matchMedia('(pointer:fine)').matches) { document.querySelectorAll('.btn').forEach(btn => { const RIM_MIN = 0.15; const RIM_MAX = 0.60; const CENTRE_MAX = 0.40; const updateGlow = e => { const rect = btn.getBoundingClientRect(); const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2; const dist = Math.hypot(e.clientX - cx, e.clientY - cy); const maxDist = Math.hypot(rect.width, rect.height) * 2; const proximity = Math.max(0, 1 - dist / maxDist); const rim = RIM_MIN + (RIM_MAX - RIM_MIN) * proximity; btn.style.setProperty('--edgeGlow', rim.toFixed(3)); if ( e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom ) { btn.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`); btn.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`); btn.style.setProperty('--centerGlow', (CENTRE_MAX * proximity).toFixed(3)); } else { btn.style.setProperty('--centerGlow', 0); } }; /* passive pointermove for smoother scroll-performance */ window.addEventListener('pointermove', updateGlow, {passive:true}); window.addEventListener('pointerleave', () => { btn.style.setProperty('--edgeGlow', RIM_MIN); btn.style.setProperty('--centerGlow', 0); }); });
}



/* === v41 additive runtime (safe) === */
(function(){
  function updateCTAPad(){
    var el = document.querySelector('.sticky-cta, .buy-cta, .cta-sticky, [data-sticky-cta]');
    var h = 0;
    if (el){
      var r = el.getBoundingClientRect();
      h = Math.ceil(r.height);
    }
    document.documentElement.style.setProperty('--cta-bottom-h', h + 'px');
  }
  
  function dockCTA(){
    var footer = document.querySelector('footer, .footer');
    var cta = document.querySelector('.sticky-cta, .buy-cta, .cta-sticky, [data-sticky-cta]');
    if (!cta || !footer){ 
      document.documentElement.style.setProperty('--cta-overlap', '0px'); 
      return; 
    }
    var vh = window.innerHeight;
    var rt = footer.getBoundingClientRect().top;
    var overlap = Math.max(0, vh - rt); /* amount footer intrudes into viewport */
    cta.style.setProperty('--cta-overlap', overlap + 'px');
    document.documentElement.style.setProperty('--cta-overlap', overlap + 'px');
  }

  function alignHeroTop(){
    var hero = document.querySelector('.hero, .Hero, section.hero');
    if (!hero) return;
    var h1 = hero.querySelector('h1');
    var media = hero.querySelector('.hero__media, .media, .chart, .figure, iframe, video, img');
    if (!h1 || !media) return;
    var t1 = h1.getBoundingClientRect().top + window.scrollY;
    var t2 = media.getBoundingClientRect().top + window.scrollY;
    var dy = Math.round(t1 - t2);
    if (dy > 0){
      media.style.marginTop = dy + 'px';
    }
  }
  function init(){
    updateCTAPad(); dockCTA();
    alignHeroTop();
  }
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', init);
  window.addEventListener('scroll', function(){ dockCTA(); }, {passive:true});
  window.addEventListener('resize', function(){ updateCTAPad(); dockCTA(); alignHeroTop(); });
  var mo = new MutationObserver(function(){ updateCTAPad(); dockCTA(); });
  mo.observe(document.documentElement, {subtree:true, childList:true, attributes:true});
  init();
})();


/* === v4: Dock sticky CTA above footer in small landscape (no overlap, matches portrait) === */
(function(){
  var mql = window.matchMedia('(max-width: 900px) and (orientation: landscape)');
  var cta = document.querySelector('.sticky-cta, .buy-cta, .cta-sticky, [data-sticky-cta]');
  var footer = document.querySelector('.footer');
  if (!cta || !footer) return;

  function computeRaise(){
    var f = footer.getBoundingClientRect();
    var c = cta.getBoundingClientRect();
    var overlap = Math.max(0, window.innerHeight - f.top);
    var raise = Math.min(Math.ceil(c.height), Math.ceil(overlap));
    var val = (mql.matches ? raise : 0);
    document.documentElement.style.setProperty('--ctaRaise', val + 'px');
  }

  var raf = 0;
  function schedule(){ if (raf) return; raf = requestAnimationFrame(function(){ raf = 0; computeRaise(); }); }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  var mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, {subtree:true, attributes:true, childList:true});
  schedule();
})();
