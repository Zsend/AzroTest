/* About Modal Video: autoplay + loop fix for mobile (iOS/Android)
   - Ensures video starts when the feature modal opens
   - Forces playsinline, muted, autoplay, loop
   - Adds an 'ended' fallback to loop reliably on iOS
   - Pauses and resets on modal close
*/
(function(){
  const onReady = (fn) => (document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn, { once: true }));
  onReady(() => {
    const modal = document.getElementById('featureModal') || document.querySelector('dialog.azro-modal#featureModal');
    if (!modal) return;

    function primeAndPlayVideo(){
      const v = modal.querySelector('.azro-modal__media video, #fmVideoBox video, .azro-video video');
      if (!v) return;

      // Force the attributes required for mobile autoplay + looping
      try {
        v.setAttribute('playsinline',''); v.playsInline = true; v.webkitPlaysInline = true;
      } catch(_){}
      try {
        v.setAttribute('muted',''); v.muted = true;
      } catch(_){}
      try {
        v.setAttribute('autoplay',''); v.autoplay = true;
      } catch(_){}
      try {
        v.setAttribute('loop',''); v.loop = true;
      } catch(_){}
      try {
        v.setAttribute('controls',''); // keep controls for accessibility
      } catch(_){}

      // Reset to frame 0 to avoid black frame, then play
      const playNow = () => { try { v.play().catch(()=>{}); } catch(_){ } };
      try { v.currentTime = 0; } catch(_){}
      try { v.load(); } catch(_){}
      // Start playback immediately when the dialog is open (user gesture just happened)
      if (modal.open) playNow();
      v.addEventListener('loadeddata', playNow, { once: true });

      // Reliable loop fallback for iOS
      v.addEventListener('ended', () => {
        try { v.currentTime = 0; v.play().catch(()=>{}); } catch(_){}
      });
    }

    // Whenever the dialog opens or swaps its inner content, ensure video is primed
    const mo = new MutationObserver(() => primeAndPlayVideo());
    mo.observe(modal, { attributes: true, attributeFilter: ['open'], subtree: true, childList: true });

    // Also try right after user interaction that triggers the modal
    document.addEventListener('click', () => { setTimeout(primeAndPlayVideo, 0); }, { passive: true });

    // Pause and reset on close to release resources
    modal.addEventListener('close', () => {
      const v = modal.querySelector('.azro-modal__media video, #fmVideoBox video, .azro-video video');
      if (v) { try { v.pause(); v.currentTime = 0; } catch(_){}
      }
    });
  });
})();