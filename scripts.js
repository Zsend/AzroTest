/* AZRO Systems — site behavior (mobile nav + accordion + tiny helpers)
   Goals: zero overlap, responsive header, accessible interactions.
*/
(function () {
  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // --- Mobile nav (locks body scroll when open) ---
  const toggle = document.querySelector('.navtoggle');
  const menu = document.querySelector('.mobilemenu');
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.hidden = !open;
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    setOpen(false);

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // --- Header fit: collapse into hamburger when nav would clip ---
    const nav = document.querySelector('.nav');
    const actions = document.querySelector('.topbar__actions');

    const computeHeaderFit = () => {
      document.body.classList.remove('header--compact');

      const actionsHidden = actions && window.getComputedStyle(actions).display === 'none';
      let compact = !!actionsHidden;

      if (!compact && nav && window.getComputedStyle(nav).display !== 'none') {
        compact = nav.scrollWidth > nav.clientWidth + 4;
      }

      document.body.classList.toggle('header--compact', compact);
      if (!compact) setOpen(false);
    };

    let resizeT = 0;
    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(computeHeaderFit, 60);
    };

    computeHeaderFit();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => computeHeaderFit()).catch(() => {});
    }
  }

  // --- Accordion (optional: only one open at a time) ---
  const accordions = document.querySelectorAll('[data-accordion]');
  accordions.forEach((acc) => {
    const items = acc.querySelectorAll('details');
    items.forEach((d) => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        items.forEach((other) => {
          if (other !== d) other.open = false;
        });
      });
    });
  });

  // --- Copy buttons (optional) ---
  const copyButtons = document.querySelectorAll('[data-copy]');
  copyButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        const prev = btn.textContent;
        btn.textContent = 'Copied';
        window.setTimeout(() => (btn.textContent = prev), 1200);
      } catch (_) {
        // Fallback: select hidden input if present
        const id = btn.getAttribute('data-copy-target');
        const el = id ? document.getElementById(id) : null;
        if (el && el.select) {
          el.select();
          document.execCommand('copy');
        }
      }
    });
  });
})();
