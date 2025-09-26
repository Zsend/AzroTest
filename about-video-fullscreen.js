(function(){
  function onReady(fn){
    if(document.readyState!=='loading'){ fn(); }
    else { document.addEventListener('DOMContentLoaded', fn, {once:true}); }
  }
  onReady(function(){
    var v = document.querySelector('.about-chart-video');
    if(!v) return;

    // Improve affordance without touching global CSS
    try { v.style.cursor = 'pointer'; v.setAttribute('tabindex','0'); v.setAttribute('role','button'); } catch(e){}

    function openFullscreen(el){
      try{
        if (el.requestFullscreen) { el.requestFullscreen(); return; }
        if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); return; } // Safari (macOS)
        if (el.msRequestFullscreen) { el.msRequestFullscreen(); return; } // IE/Edge legacy
        if (typeof el.webkitEnterFullScreen === 'function') { el.webkitEnterFullScreen(); return; } // iOS Safari older
        if (typeof el.webkitEnterFullscreen === 'function') { el.webkitEnterFullscreen(); return; } // iOS Safari variant
      }catch(e){}
      // As a graceful fallback, open the file directly
      try { var url = el.currentSrc || el.src; if (url) window.open(url, '_blank'); } catch(_){}
    }

    function toggleFullscreen(){
      var d = document;
      var isFS = d.fullscreenElement || d.webkitFullscreenElement || d.msFullscreenElement || (v.webkitDisplayingFullscreen === true);
      if (isFS) {
        try {
          (d.exitFullscreen || d.webkitExitFullscreen || d.msExitFullscreen || function(){ try{ v.webkitExitFullscreen && v.webkitExitFullscreen(); }catch(e){} }).call(d);
        } catch(e){}
        return;
      }
      openFullscreen(v);
    }

    // Handle clicks/taps/keyboard
    v.addEventListener('click', toggleFullscreen, {passive:true});
    v.addEventListener('touchend', function(e){ toggleFullscreen(); }, {passive:true});
    v.addEventListener('keydown', function(e){ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); toggleFullscreen(); } });

    // If a wrapper overlay exists, capture clicks on the specific container
    var container = v.closest('.media');
    if (container) {
      container.addEventListener('click', function(e){
        if (e.target !== v && container.contains(e.target)) toggleFullscreen();
      }, {passive:true});
    }
  });
})();