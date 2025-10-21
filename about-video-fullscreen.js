(function(){
  function onReady(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }
  onReady(function(){
    var v = document.querySelector('.about-chart-video');
    if (!v) return;
    try { v.style.cursor = 'pointer'; } catch(e){}
    v.setAttribute('tabindex','0');
    v.setAttribute('role','button');
    function openFS(el){
      try { if (el.requestFullscreen) { el.requestFullscreen(); return; } } catch(e){}
      try { if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); return; } } catch(e){}
      try { if (el.msRequestFullscreen) { el.msRequestFullscreen(); return; } } catch(e){}
      try { if (typeof el.webkitEnterFullScreen === 'function') { el.webkitEnterFullScreen(); return; } } catch(e){}
      try { if (typeof el.webkitEnterFullscreen === 'function') { el.webkitEnterFullscreen(); return; } } catch(e){}
      // Fallback: open the video URL
      try {
        var url = el.currentSrc || el.src;
        if (url) window.open(url, '_blank');
      } catch(_){}
    }
    function exitFS(){
      var d=document;
      try { if (d.exitFullscreen) return d.exitFullscreen(); } catch(e){}
      try { if (d.webkitExitFullscreen) return d.webkitExitFullscreen(); } catch(e){}
      try { if (d.msExitFullscreen) return d.msExitFullscreen(); } catch(e){}
      try { if (v.webkitExitFullscreen) return v.webkitExitFullscreen(); } catch(e){}
    }
    function toggleFS(){
      var d=document;
      var isFS = d.fullscreenElement || d.webkitFullscreenElement || d.msFullscreenElement || (v.webkitDisplayingFullscreen===true);
      if (isFS) { exitFS(); } else { openFS(v); }
    }
    v.addEventListener('click', toggleFS, { passive:true });
    v.addEventListener('touchend', function(){ toggleFS(); }, { passive:true });
    v.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggleFS(); } });
    var container = v.closest('.media');
    if (container) {
      container.addEventListener('click', function(e){
        if (e.target !== v && container.contains(e.target)) toggleFS();
      }, { passive:true });
    }
  });
})();


/* v41.4 – robust mobile landscape preview + centering hooks */
(function(){
  function ready(fn){ if (document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn, {once:true}); }
  function isLm(){ return matchMedia('(orientation: landscape) and (max-width: 900px)').matches; }
  function openFS(el){
    if (!el) return;
    try{ if(el.requestFullscreen){ el.requestFullscreen(); return; } }catch(e){}
    try{ if(el.webkitRequestFullscreen){ el.webkitRequestFullscreen(); return; } }catch(e){}
    try{ if(el.msRequestFullscreen){ el.msRequestFullscreen(); return; } }catch(e){}
    try{ if(typeof el.webkitEnterFullScreen==='function'){ el.webkitEnterFullScreen(); return; } }catch(e){}
    var src = el.currentSrc || el.src || (el.querySelector('source')||{}).src; if(src) window.open(src,'_blank','noopener,noreferrer');
  }
  function ensurePreviewForDialog(dlg){
    if (!dlg) return;
    var box = dlg.querySelector('.azro-modal__media');
    if (!box || box.querySelector('.azro-video__preview')) return;
    var preview = document.createElement('div'); preview.className='azro-video__preview';
    var btn = document.createElement('button'); btn.type='button'; btn.setAttribute('aria-label','Open video in fullscreen'); btn.textContent='▶';
    var note = document.createElement('small'); note.textContent='Open video preview';
    preview.appendChild(btn); preview.appendChild(note); box.appendChild(preview);
    // Preferred target: about hero video (visually highest quality consistent asset)
    var heroV = document.querySelector('.about-hero video, section.hero.about-hero video, .about-hero .media video');
    var target = heroV || box.querySelector('video');
    btn.addEventListener('click', function(){ openFS(target); }, {passive:true});
  }
  ready(function(){
    // Center sticky CTA even after modal close
    (function fixSticky(){
      var sc = document.querySelector('.sticky-cta');
      if (sc){ sc.style.left='50%'; sc.style.transform='translateX(-50%)'; sc.style.right='auto'; }
    })();

    // Inject preview on initial open and on orientation/resize
    function wire(){
      if (!isLm()) return;
      document.querySelectorAll('dialog.azro-modal').forEach(function(dlg){
        if (dlg.open) ensurePreviewForDialog(dlg);
        // Observe open attribute toggles
        new MutationObserver(function(list){
          list.forEach(function(m){ if(m.attributeName==='open' && dlg.open) ensurePreviewForDialog(dlg); });
        }).observe(dlg, {attributes:true});
      });
    }
    wire();
    window.addEventListener('resize', wire, {passive:true});
    window.addEventListener('orientationchange', wire, {passive:true});
  });
})();


/* v41.5 — Landscape mobile: treat .azro-video__ph as the preview button */
(function(){
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn, {once:true}); }
  function isLandscapeMobile(){ return matchMedia('(orientation: landscape) and (max-width: 900px)').matches; }
  function openFS(el){
    if(!el) return;
    try{ if(el.requestFullscreen){ el.requestFullscreen(); return; } }catch(e){}
    try{ if(el.webkitRequestFullscreen){ el.webkitRequestFullscreen(); return; } }catch(e){}
    try{ if(el.msRequestFullscreen){ el.msRequestFullscreen(); return; } }catch(e){}
    try{ if(typeof el.webkitEnterFullScreen==='function'){ el.webkitEnterFullScreen(); return; } }catch(e){}
    var src = el.currentSrc || el.src || (el.querySelector('source')||{}).src;
    if (src) window.open(src, '_blank', 'noopener,noreferrer');
  }
  ready(function(){
    if (!isLandscapeMobile()) return;
    var heroV = document.querySelector('.about-hero video, section.hero.about-hero video, .about-hero .media video');
    document.querySelectorAll('dialog.azro-modal .azro-video__ph').forEach(function(ph){
      try{ ph.style.cursor='pointer'; }catch(e){}
      ph.addEventListener('click', function(){
        var dlgVideo = ph.parentElement && ph.parentElement.querySelector('video');
        openFS(heroV || dlgVideo);
      }, {passive:true});
    });
  });
})();

