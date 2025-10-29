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