(function(){
  const menuBtn = document.querySelector('[data-menu-btn]');
  const menu = document.querySelector('[data-mobile-menu]');

  if(menuBtn && menu){
    const setOpen = (open) => {
      menu.dataset.open = open ? 'true' : 'false';
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    menuBtn.addEventListener('click', () => {
      const open = menu.dataset.open === 'true';
      setOpen(!open);
    });

    // Close menu when a link is clicked
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setOpen(false));
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') setOpen(false);
    });
  }

  // Smooth-scroll for same-page anchors (respects reduced motion)
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!prefersReduced){
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if(!id || id.length < 2) return;
        const el = document.querySelector(id);
        if(!el) return;
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null, '', id);
      });
    });
  }
})();
