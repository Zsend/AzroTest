
/* === v42 behavior fixes ====================================================
   - Replace inline video with an on-brand preview button; opens video fullscreen
   - Ensure sticky CTA remains centered after modals close/open
   - Minor accessibility tweaks for keyboard & screen readers
   ========================================================================= */

(function(){
  function ready(cb){ 
    if(document.readyState !== 'loading') cb(); 
    else document.addEventListener('DOMContentLoaded', cb, {once:true});
  }

  /* -------- Fullscreen helpers -------- */
  function requestFS(el){
    if(!el) return false;
    try{
      if(el.requestFullscreen) { el.requestFullscreen(); return true; }
      if(el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); return true; }
      if(el.msRequestFullscreen) { el.msRequestFullscreen(); return true; }
    }catch(e){}
    return false;
  }
  function exitFS(){
    var d = document;
    try{
      (d.exitFullscreen||d.webkitExitFullscreen||d.msExitFullscreen||function(){})().call(d);
    }catch(e){}
  }

  /* -------- Sticky CTA alignment -------- */
  function centerStickyCTA(){
    var cta = document.querySelector('.sticky-cta');
    if(!cta) return;
    // Ensure there's exactly one button container element and it's centered
    cta.style.left = '50%';
    cta.style.transform = 'translateX(-50%)';
  }

  /* -------- Replace hero video with preview button -------- */
  function enhanceVideoPreview(){
    var media = document.querySelector('.about-hero .media video') 
             || document.querySelector('.hero .media video') 
             || document.querySelector('figure.media-card .media video');
    if(!media) return;

    // Do not auto play, we will open on demand
    try{ media.pause(); }catch(e){}
    media.removeAttribute('autoplay');
    media.setAttribute('preload', 'metadata');
    media.setAttribute('controls', ''); // controls when fullscreen

    // Build preview overlay right next to the video
    var box = media.parentElement;
    if(!box) return;
    // If there is already a preview in the modal script, skip to avoid duplicates
    if(box.querySelector('.azro-video__preview')) return;

    var preview = document.createElement('div');
    preview.className = 'azro-video__preview';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open demonstration video in fullscreen');
    btn.textContent = '▶';
    preview.appendChild(btn);

    var note = document.createElement('small');
    note.textContent = 'Open video preview';
    preview.appendChild(note);

    // Hide the video until the user taps
    media.style.display = 'none';
    box.appendChild(preview);

    function openVideo(){
      // Show the underlying video element just before requesting fullscreen
      media.style.display = '';
      // Try to request fullscreen and play
      var ok = requestFS(media);
      try{ media.play().catch(function(){}); }catch(e){}
      if(!ok){
        // If fullscreen isn't available, fall back to a light dialog
        var dlg = document.getElementById('videoDialog');
        if(!dlg){
          dlg = document.createElement('dialog');
          dlg.id = 'videoDialog';
          dlg.setAttribute('aria-label','Video preview');
          dlg.innerHTML = '<form method="dialog" style="margin:0;padding:0;border:0;background:transparent">'
                        + '  <div style="display:grid;place-items:center;max-width:92vw">'
                        + '    <video controls playsinline style="width:min(1100px,92vw);height:auto;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5)"></video>'
                        + '    <div style="margin-top:10px;text-align:center">'
                        + '      <button value="close" class="btn btn--primary" style="min-width:200px">Close</button>'
                        + '    </div>'
                        + '  </div>'
                        + '</form>';
          document.body.appendChild(dlg);
        }
        var v2 = dlg.querySelector('video');
        v2.src = media.currentSrc || media.src;
        try{ v2.play().catch(function(){}); }catch(e){}
        try{ dlg.showModal(); }catch(e){ dlg.setAttribute('open','');}
        dlg.addEventListener('close', function(){ try{ v2.pause(); }catch(e){} }, {once:true});
      }
    }

    btn.addEventListener('click', openVideo);
    // Make entire preview focusable and keyboard operable
    preview.tabIndex = 0;
    preview.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openVideo(); }
    });
  }

  ready(function(){
    centerStickyCTA();
    enhanceVideoPreview();
  });

  window.addEventListener('resize', centerStickyCTA);
  window.addEventListener('orientationchange', centerStickyCTA);



  /* -------- Add preview button inside Feature modal ---------------------- */
  function ensureModalPreview(){
    var dlg = document.getElementById('featureModal');
    if(!dlg || !dlg.open) return;
    var box = dlg.querySelector('.azro-modal__media');
    if(!box) return;
    if(box.querySelector('.azro-video__preview')) return;
    var btnBox = document.createElement('div');
    btnBox.className = 'azro-video__preview';
    var btn = document.createElement('button'); 
    btn.type='button'; 
    btn.setAttribute('aria-label','Open video in fullscreen'); 
    btn.textContent='▶';
    var note = document.createElement('small'); note.textContent='Open video preview';
    btnBox.appendChild(btn); btnBox.appendChild(note);
    box.appendChild(btnBox);
    btn.addEventListener('click', function(){
      // Try to open the hero video; if not found, open the first video on page
      var target = document.querySelector('.about-hero video') || document.querySelector('video');
      if(!target){ return; }
      requestFS(target); 
      try{ target.play().catch(function(){}); }catch(e){}
    });
  }

  // When the feature modal opens, inject preview
  document.addEventListener('click', function(e){
    // Slightly defer to ensure modal DOM is populated
    setTimeout(ensureModalPreview, 30);
  }, true);

  // In case the modal is programmatically opened
  var obs = new MutationObserver(function(){ ensureModalPreview(); centerStickyCTA(); });
  ready(function(){ obs.observe(document.documentElement, {subtree:true, attributes:true, childList:true}); });


})();
