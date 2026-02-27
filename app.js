(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const toggle = document.querySelector('.nav__toggle');
  const panel = document.getElementById('nav-panel');
  if (!toggle || !panel) return;

  const close = () => {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('is-open')) return;
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (panel.contains(target) || toggle.contains(target)) return;
    close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();
