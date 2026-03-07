(function () {
  function fitArtboards() {
    document.querySelectorAll('.artboard-wrap').forEach((wrap) => {
      const board = wrap.querySelector('.artboard');
      if (!board) return;
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      wrap.style.width = `${1920 * scale}px`;
      wrap.style.height = `${1080 * scale}px`;
      board.style.transform = `scale(${scale})`;
    });
  }

  function fitLivePreviews() {
    document.querySelectorAll('.live-preview').forEach((wrap) => {
      const frame = wrap.querySelector('iframe');
      if (!frame) return;
      const scale = wrap.clientWidth / 1920;
      wrap.style.height = `${1080 * scale}px`;
      frame.style.width = '1920px';
      frame.style.height = '1080px';
      frame.style.transformOrigin = 'top left';
      frame.style.transform = `scale(${scale})`;
    });
  }

  function refresh() {
    fitArtboards();
    fitLivePreviews();
  }

  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('load', refresh);
})();
