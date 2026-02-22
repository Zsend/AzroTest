// Minimal JS: mobile drawer + accordion
(() => {
  const drawer = document.querySelector('[data-drawer]');
  const openBtn = document.querySelector('[data-drawer-open]');
  const closeBtn = document.querySelector('[data-drawer-close]');

  function openDrawer(){ drawer?.setAttribute('data-open', 'true'); }
  function closeDrawer(){ drawer?.setAttribute('data-open', 'false'); }

  openBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  drawer?.addEventListener('click', (e) => {
    if (e.target === drawer) closeDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  document.querySelectorAll('[data-accordion] .acc-item .acc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.acc-item');
      const open = item.getAttribute('data-open') === 'true';
      // close others in same accordion
      const acc = btn.closest('[data-accordion]');
      acc.querySelectorAll('.acc-item').forEach(i => i.setAttribute('data-open', 'false'));
      item.setAttribute('data-open', open ? 'false' : 'true');
    });
  });
})();
