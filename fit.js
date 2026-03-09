
(function () {
  function fitArtboards() {
    const boards = document.querySelectorAll('.artboard-wrap');
    const pad = 24;
    boards.forEach((wrap) => {
      const board = wrap.querySelector('.artboard');
      if (!board) return;
      const usableW = Math.max(320, window.innerWidth - pad * 2);
      const usableH = Math.max(320, window.innerHeight - pad * 2);
      const scale = Math.min(usableW / 1920, usableH / 1080);
      wrap.style.width = `${1920 * scale}px`;
      wrap.style.height = `${1080 * scale}px`;
      board.style.transform = `scale(${scale})`;
    });
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  window.addEventListener('resize', fitArtboards, { passive: true });
  window.addEventListener('load', fitArtboards);
})();
