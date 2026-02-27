(() => {
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  // Mobile nav
  const toggle = qs('.nav-toggle');
  const menu = qs('#nav-menu');
  if (toggle && menu) {
    const closeMenu = () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    };

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close on navigation
    qsa('a[href^="#"]', menu).forEach(a => {
      a.addEventListener('click', () => closeMenu());
    });

    // Close on outside click (mobile)
    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('open')) return;
      const within = menu.contains(e.target) || toggle.contains(e.target);
      if (!within) closeMenu();
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // Lightbox for images
  const lightbox = qs('[data-lightbox-modal]');
  const lightboxImg = qs('.lightbox-img', lightbox);
  const lightboxClose = qs('.lightbox-close', lightbox);

  const openLightbox = (src, alt) => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightbox || !lightboxImg) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    lightboxImg.alt = '';
    document.body.style.overflow = '';
  };

  qsa('img[data-lightbox]').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt));
    img.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(img.currentSrc || img.src, img.alt);
      }
    });
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Open image preview');
  });

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      const isBackdrop = e.target === lightbox;
      if (isBackdrop) closeLightbox();
    });
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Accordion: keep it calm (optional) — allow multiple open on desktop, but close others on mobile.
  const acc = qs('[data-accordion]');
  if (acc) {
    const items = qsa('details', acc);
    items.forEach(d => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        // On smaller screens, close others to reduce scroll burden.
        if (window.matchMedia('(max-width: 720px)').matches) {
          items.forEach(o => { if (o !== d) o.open = false; });
        }
      });
    });
  }
})();
