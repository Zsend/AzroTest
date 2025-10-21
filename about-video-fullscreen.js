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


/* v41.3 — Ensure preview button is injected when dialogs open (mobile landscape) */
(function(){
  function ready(fn){ if (document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn, {once:true}); }
  function isLandscapeMobile(){ return matchMedia('(orientation: landscape) and (max-width: 900px)').matches; }
  function openFS(el){
    try{ if(el && el.requestFullscreen){ el.requestFullscreen(); return; } }catch(e){}
    try{ if(el && el.webkitRequestFullscreen){ el.webkitRequestFullscreen(); return; } }catch(e){}
    try{ if(el && el.msRequestFullscreen){ el.msRequestFullscreen(); return; } }catch(e){}
    try{ if(el && typeof el.webkitEnterFullScreen==='function'){ el.webkitEnterFullScreen(); return; } }catch(e){}
    var src = el && (el.currentSrc || el.src); if(src) window.open(src, '_blank', 'noopener,noreferrer');
  }
  ready(function(){
    if (!isLandscapeMobile()) return;
    function ensurePreview(dlg){
      if (!dlg || !dlg.open) return;
      var box = dlg.querySelector('.azro-modal__media'); if (!box) return;
      if (box.querySelector('.azro-video__preview')) return;
      var preview = document.createElement('div'); preview.className='azro-video__preview';
      var btn = document.createElement('button'); btn.type='button'; btn.setAttribute('aria-label','Open video in fullscreen'); btn.textContent='▶';
      var note = document.createElement('small'); note.textContent='Open video preview';
      preview.appendChild(btn); preview.appendChild(note); box.appendChild(preview);
      var heroV = document.querySelector('.about-hero video, section.hero.about-hero video, .about-hero .media video');
      var target = heroV || box.querySelector('video');
      btn.addEventListener('click', function(){ openFS(target); }, {passive:true});
    }
    var observer = new MutationObserver(function(list){
      list.forEach(function(m){
        if (m.type==='attributes' && m.attributeName==='open') ensurePreview(m.target);
      });
    });
    document.querySelectorAll('dialog.azro-modal').forEach(function(d){ observer.observe(d, {attributes:true}); if (d.open) ensurePreview(d); });
  });
})();

