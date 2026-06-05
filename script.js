(() => {
  const modals = {
    main: document.getElementById('modal'),
    search: document.getElementById('search-modal'),
    menu: document.getElementById('menu-modal')
  };
  const modalTitle = document.getElementById('modal-title');
  const openModal = (modal = modals.main, title) => {
    if (!modal) return;
    Object.values(modals).forEach(m => m && m.setAttribute('aria-hidden', 'true'));
    if (title && modalTitle && modal === modals.main) modalTitle.textContent = title;
    modal.setAttribute('aria-hidden', 'false');
    const input = modal.querySelector('input, select, button');
    window.setTimeout(() => input && input.focus(), 60);
  };
  const closeModals = () => Object.values(modals).forEach(m => m && m.setAttribute('aria-hidden', 'true'));
  document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModals));
  document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', e => { if(e.target === modal) closeModals(); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });

  document.querySelectorAll('[data-search]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); openModal(modals.search); }));
  document.querySelectorAll('[data-menu]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); openModal(modals.menu); }));

  document.querySelectorAll('[data-modal-title]').forEach(el => {
    el.addEventListener('click', e => {
      const href = el.getAttribute('href') || '';
      if (href && href.endsWith('.html')) return;
      e.preventDefault();
      openModal(modals.main, el.dataset.modalTitle || 'Join founder access');
    });
  });

  const scrollToRatio = ratio => {
    const stage = document.querySelector('.desktop-site') || document.querySelector('.tablet-site') || document.querySelector('.phone-site');
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const y = window.scrollY + rect.top + rect.height * Number(ratio);
    window.scrollTo({ top: Math.max(0, y - 34), behavior: 'smooth' });
  };
  document.querySelectorAll('[data-scroll]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); closeModals(); scrollToRatio(el.dataset.scroll); });
  });

  const saveLead = data => {
    const key = 'craglink_founder_leads';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.push({ ...data, createdAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(current));
  };
  document.querySelectorAll('[data-founder-form], [data-inline-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const email = String(formData.get('email') || '').trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        alert('Please enter a valid email.');
        return;
      }
      saveLead(Object.fromEntries(formData.entries()));
      form.reset();
      closeModals();
      window.location.href = 'success.html';
    });
  });
})();
