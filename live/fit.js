
(function () {
  function fitArtboards() {
    const boards = document.querySelectorAll('.artboard-wrap');
    boards.forEach((wrap) => {
      const board = wrap.querySelector('.artboard');
      if (!board) return;
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      wrap.style.width = `${1920 * scale}px`;
      wrap.style.height = `${1080 * scale}px`;
      board.style.transform = `scale(${scale})`;
    });
  }
  window.addEventListener('resize', fitArtboards, { passive: true });
  window.addEventListener('load', fitArtboards);
})();
