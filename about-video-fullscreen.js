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


/* v41.2 – Landscape modal media -> preview button; robust hero fullscreen */
(function(){
  function ready(fn){ if (document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn, {once:true}); }
  function isLandscapeMobile(){ return matchMedia('(orientation: landscape) and (max-width: 900px)').matches; }
  function openFS(el){
    try{ if(el.requestFullscreen){ el.requestFullscreen(); return; } }catch(e){}
    try{ if(el.webkitRequestFullscreen){ el.webkitRequestFullscreen(); return; } }catch(e){}
    try{ if(el.msRequestFullscreen){ el.msRequestFullscreen(); return; } }catch(e){}
    try{ if(typeof el.webkitEnterFullScreen==='function'){ el.webkitEnterFullScreen(); return; } }catch(e){}
    // Fallback: open src in new tab if available
    var src = (el.currentSrc || el.src || (el.querySelector('source')||{}).src || (el.querySelector('video')||{}).src);
    if(src) window.open(src, '_blank', 'noopener,noreferrer');
  }
  ready(function(){
    /* 1) Make about hero video fullscreen-capable (no extra class required) */
    var heroV = document.querySelector('.about-hero video, section.hero.about-hero video, .about-hero .media video');
    if (heroV){
      try{ heroV.style.cursor='pointer'; }catch(e){}
      var toggle = function(){
        var d=document; var isFS = d.fullscreenElement || d.webkitFullscreenElement || d.msFullscreenElement || (heroV.webkitDisplayingFullscreen===true);
        if(isFS){ try{(d.exitFullscreen||d.webkitExitFullscreen||d.msExitFullscreen||function(){})()}catch(e){} } else { openFS(heroV); }
      };
      heroV.addEventListener('click', toggle, {passive:true});
      heroV.addEventListener('touchend', toggle, {passive:true});
      heroV.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
      var container = heroV.closest('.media'); if(container){ container.addEventListener('click', function(e){ if(e.target!==heroV && container.contains(e.target)) toggle(); }, {passive:true}); }
    }

    /* 2) In mobile landscape, replace modal media with a preview button that opens fullscreen */
    if (!isLandscapeMobile()) return;
    var modalMedias = document.querySelectorAll('dialog.azro-modal .azro-modal__media');
    modalMedias.forEach(function(box){
      // If a preview already exists, skip
      if (box.querySelector('.azro-video__preview')) return;
      // Build lightweight preview
      var preview = document.createElement('div');
      preview.className = 'azro-video__preview';
      var btn = document.createElement('button');
      btn.type = 'button'; btn.setAttribute('aria-label','Open video preview (fullscreen)'); btn.innerHTML = '▶';
      var note = document.createElement('small'); note.textContent = 'Open video preview';
      preview.appendChild(btn); preview.appendChild(note);
      // Insert
      box.appendChild(preview);
      // Click -> open hero video (preferred), else any video inside modal
      btn.addEventListener('click', function(){
        var target = heroV || box.querySelector('video');
        if (target) openFS(target);
      }, {passive:true});
    });
  });
})();

