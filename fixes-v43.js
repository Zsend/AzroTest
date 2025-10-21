
/* === v43: tightly scoped behavior fixes ===================================
   - Only affect About page video preview and sticky CTA recenter on dialog close.
   ========================================================================= */

(function(){
  function ready(cb){ 
    if(document.readyState !== 'loading') cb(); 
    else document.addEventListener('DOMContentLoaded', cb, {once:true});
  }

  /* Replace About page hero video with a preview button that opens fullscreen */
  function enhanceAboutVideo(){
    var aboutHero = document.querySelector('.about-hero');
    if(!aboutHero) return; // only About page

    var media = document.querySelector('figure.media-card .media video');
    if(!media) return;

    try{ media.pause(); }catch(e){}
    media.removeAttribute('autoplay');
    media.setAttribute('preload','metadata');
    media.setAttribute('playsinline','');
    media.setAttribute('controls',''); // only shown fullscreen

    // Avoid duplicate preview
    var box = media.parentElement;
    if(!box || box.querySelector('.azro-video__preview')) return;

    var preview = document.createElement('div');
    preview.className = 'azro-video__preview';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label','Open video in fullscreen');
    btn.textContent = '▶';
    preview.appendChild(btn);

    // Hide inline video; we only show it when fullscreen launches
    media.style.display = 'none';
    box.appendChild(preview);

    function openFS(el){
      try{ if(el.requestFullscreen){ el.requestFullscreen(); return true; } }catch(e){}
      try{ if(el.webkitRequestFullscreen){ el.webkitRequestFullscreen(); return true; } }catch(e){}
      return false;
    }

    btn.addEventListener('click', function(){
      media.style.display = '';
      var ok = openFS(media);
      try{ media.play().catch(function(){}); }catch(e){}
      if(!ok){
        // simple centered dialog fallback
        var dlg = document.getElementById('videoDialog');
        if(!dlg){
          dlg = document.createElement('dialog');
          dlg.id='videoDialog';
          dlg.innerHTML = '<form method="dialog" style="margin:0;background:transparent">'
            + '<div style="display:grid;place-items:center">'
            + '<video controls playsinline style="width:min(1100px,92vw);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5)"></video>'
            + '<div style="text-align:center;margin-top:10px"><button class="btn" value="close">Close</button></div>'
            + '</div></form>';
          document.body.appendChild(dlg);
        }
        var v2 = dlg.querySelector('video');
        v2.src = media.currentSrc || media.src;
        try{ v2.play().catch(function(){}); }catch(e){}
        try{ dlg.showModal(); }catch(e){ dlg.setAttribute('open',''); }
        dlg.addEventListener('close', function(){ try{ v2.pause(); }catch(e){} }, {once:true});
      }
    });
  }

  /* Keep sticky CTA centered after any dialog close/open without changing its layout */
  function stabilizeStickyCTA(){
    var cta = document.querySelector('.sticky-cta');
    if(!cta) return;
    // Remove any accidental transforms added by other CSS
    cta.style.transform = 'none';
    cta.style.left = '0';
    cta.style.right = '0';
    cta.style.width = '100%';
  }

  ready(function(){
    enhanceAboutVideo();
    stabilizeStickyCTA();
  });

  window.addEventListener('resize', stabilizeStickyCTA);
  window.addEventListener('orientationchange', stabilizeStickyCTA);
  document.addEventListener('close', stabilizeStickyCTA, true);
  document.addEventListener('click', function(){ setTimeout(stabilizeStickyCTA, 30); }, true);
})();
