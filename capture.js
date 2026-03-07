
(function(){
  const root = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const size = params.get('size') === '1600' ? '1600' : '1920';
  const targetW = size === '1600' ? 1600 : 1920;
  const targetH = size === '1600' ? 900 : 1080;
  const baseScale = targetW / 1920;

  function fitStage(){
    const pad = 24 * 2;
    const availW = Math.max(320, window.innerWidth - pad);
    const availH = Math.max(320, window.innerHeight - pad);
    const fitScale = Math.min(1, availW / targetW, availH / targetH);
    root.style.setProperty('--capture-scale', String(baseScale * fitScale));
    document.body.style.minHeight = Math.ceil(targetH * fitScale + pad) + 'px';
    document.body.dataset.captureSize = size;
  }

  window.addEventListener('resize', fitStage, { passive: true });
  fitStage();
})();
