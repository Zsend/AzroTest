
(function () {
  function fitArtboards() {
    const boards = document.querySelectorAll('.artboard-wrap');
    const pad = 24;
    boards.forEach((wrap) => {
      const board = wrap.querySelector('.artboard');
      if (!board) return;
      const scale = Math.min((window.innerWidth - pad * 2) / 1920, (window.innerHeight - pad * 2) / 1080, 1);
      wrap.style.width = `${1920 * scale}px`;
      wrap.style.height = `${1080 * scale}px`;
      board.style.transform = `scale(${scale})`;
    });
  }
  window.addEventListener('resize', fitArtboards, { passive: true });
  window.addEventListener('load', fitArtboards);
})();
