/* AZRO Site — v7 FINAL */

(function () {
  const root = document.documentElement;

  // Theme toggle (light/dark/system)
  const themeBtn = document.querySelector('[data-theme-toggle]');
  const THEME_KEY = 'azro-theme';

  function applyTheme(theme) {
    if (!theme || theme === 'system') {
      root.removeAttribute('data-theme');
      localStorage.removeItem(THEME_KEY);
      if (themeBtn) themeBtn.setAttribute('aria-label', 'Theme: System');
      return;
    }
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (themeBtn) themeBtn.setAttribute('aria-label', `Theme: ${theme[0].toUpperCase()}${theme.slice(1)}`);
  }

  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) applyTheme(saved);
  } catch (e) {
    // ignore storage errors
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      if (!current) { applyTheme('dark'); return; }
      if (current === 'dark') { applyTheme('light'); return; }
      applyTheme('system');
    });
  }

  // Mobile menu
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');

  function setMenu(open) {
    if (!menu) return;
    menu.dataset.open = open ? 'true' : 'false';
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      const open = menu.dataset.open === 'true';
      setMenu(!open);
    });

    // Close on link click
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setMenu(false));
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  // Mark external links
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('http')) {
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('target', '_blank');
    }
  });
})();
