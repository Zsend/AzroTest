/* AZRO Systems — site JS (minimal)
   - Mobile nav toggle
*/

(function () {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  if (!header || !toggle || !nav) return;

  const setOpen = (open) => {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  // Toggle
  toggle.addEventListener('click', () => {
    const open = !header.classList.contains('nav-open');
    setOpen(open);
  });

  // Close on link click (mobile)
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    setOpen(false);
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!header.classList.contains('nav-open')) return;
    if (header.contains(e.target)) return;
    setOpen(false);
  });

  // Keep state sane on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 920) setOpen(false);
  });
})();
