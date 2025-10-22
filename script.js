/* Cursor-reactive glow for Gumroad button (desktop pointers) */
if (window.matchMedia('(pointer:fine)').matches) { document.querySelectorAll('.btn').forEach(btn => { const RIM_MIN = 0.15; const RIM_MAX = 0.60; const CENTRE_MAX = 0.40; const updateGlow = e => { const rect = btn.getBoundingClientRect(); const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2; const dist = Math.hypot(e.clientX - cx, e.clientY - cy); const maxDist = Math.hypot(rect.width, rect.height) * 2; const proximity = Math.max(0, 1 - dist / maxDist); const rim = RIM_MIN + (RIM_MAX - RIM_MIN) * proximity; btn.style.setProperty('--edgeGlow', rim.toFixed(3)); if ( e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom ) { btn.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`); btn.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`); btn.style.setProperty('--centerGlow', (CENTRE_MAX * proximity).toFixed(3)); } else { btn.style.setProperty('--centerGlow', 0); } }; /* passive pointermove for smoother scroll-performance */ window.addEventListener('pointermove', updateGlow, {passive:true}); window.addEventListener('pointerleave', () => { btn.style.setProperty('--edgeGlow', RIM_MIN); btn.style.setProperty('--centerGlow', 0); }); });
}



/* === v41 additive runtime (safe) === */
(function(){
  function updateCTAPad(){
    var el = document.querySelector('.sticky-cta, .buy-cta, .cta-sticky, [data-sticky-cta]');
    var h = 0;
    if (el){
      // Always use element height so content never hides behind the bar.
      var r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0){ h = Math.ceil(r.height); }
    }
    document.documentElement.style.setProperty('--cta-bottom-h', h + 'px');
  }
  function updateCTAStop(){ var cta=document.querySelector('.sticky-cta, .buy-cta, .cta-sticky, [data-sticky-cta]'); if(!cta) return; cta.style.bottom='0px'; cta.style.left='0'; cta.style.right='0'; }
    var rectF = footer.getBoundingClientRect();
    var overlap = Math.max(0, window.innerHeight - rectF.top);
    var safe = (overlap > 1 ? overlap : 0);
    cta.style.bottom = safe + 'px';
    cta.style.left = '0';
    cta.style.right = '0';
    cta.style.transform = 'none';
  }

  
  function enforceStickyCenter(){
    var el = document.querySelector('.sticky-cta');
    if (!el) return;
    el.style.display = 'flex';
    el.style.justifyContent = 'center';
    el.style.alignItems = 'center';
  }

  function nudgeCTAFromFooter(){
    var el = document.querySelector('.sticky-cta, .buy-cta, .cta-sticky, [data-sticky-cta]');
    var footer = document.querySelector('.footer');
    if (!el || !footer){ document.documentElement.style.setProperty('--cta-lift','0px'); return; }
    var fr = footer.getBoundingClientRect();
    var h = Math.ceil(el.getBoundingClientRect().height || 0);
    var overlap = Math.max(0, (window.innerHeight - fr.top));
    var lift = Math.min(overlap, h); // never lift more than the CTA height
    document.documentElement.style.setProperty('--cta-lift', lift + 'px');
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
    updateCTAPad();
    nudgeCTAFromFooter();
    alignHeroTop();
  }
  window.addEventListener('load', init);
  window.addEventListener('scroll', updateCTAStop, {passive:true});
  window.addEventListener('orientationchange', updateCTAStop);
  window.addEventListener('resize', function(){ updateCTAPad(); enforceStickyCenter(); alignHeroTop(); });
  var mo = new MutationObserver(function(){ updateCTAPad(); enforceStickyCenter(); });
  mo.observe(document.documentElement, {subtree:true, childList:true, attributes:true});
  init();
window.addEventListener('scroll', function(){ nudgeCTAFromFooter(); }, {passive:true});
})();

/* === Sticky CTA: stop before footer (mobile landscape & small screens) === */
(function(){
  var rafId = 0;
  function adjustCTA(){
    var cta = document.querySelector('.sticky-cta, .buy-cta, .cta-sticky, [data-sticky-cta]');
    if (!cta) return;
    var footer = document.querySelector('footer, .footer');
    // keep --cta-bottom-h fresh for spacing
    var r = cta.getBoundingClientRect();
    var h = Math.ceil(r.height || 0);
    document.documentElement.style.setProperty('--cta-bottom-h', h + 'px');
    // if footer is in view, shift the bar up so it "parks" above it
    if (footer){
      var fr = footer.getBoundingClientRect();
      var overlap = Math.max(0, window.innerHeight - fr.top);
      cta.style.setProperty('transform', 'translateY(' + (overlap ? -overlap : 0) + 'px)', 'important');
      // reinforce centering
      cta.style.setProperty('left', '0');
      cta.style.setProperty('right', '0');
      cta.style.setProperty('textAlign', 'center');
    }
  }
  function schedule(){ if (rafId) return; rafId = requestAnimationFrame(function(){ rafId = 0; adjustCTA(); }); }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.addEventListener('load', schedule);
  // Modal open/close on About page may cause transforms; resync on toggle
  try{
    var m = document.getElementById('featureModal');
    if (m){
      new MutationObserver(schedule).observe(m, {attributes:true, attributeFilter:['open']});
    }
  }catch(e){}
  schedule();
})();
