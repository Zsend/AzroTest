(() => {
  const body = document.body;
  const drawer = document.querySelector('.drawer');
  const menuToggle = document.querySelector('.menu-toggle');
  const modal = document.querySelector('.modal');
  const modalTitle = document.getElementById('modal-title');
  const modalEyebrow = document.getElementById('modal-eyebrow');
  const modalCopy = document.getElementById('modal-copy');

  function lock(state) { body.style.overflow = state ? 'hidden' : ''; }
  function openDrawer() { if (!drawer) return; drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); menuToggle?.setAttribute('aria-expanded','true'); lock(true); }
  function closeDrawer() { if (!drawer) return; drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); menuToggle?.setAttribute('aria-expanded','false'); lock(false); }

  menuToggle?.addEventListener('click', () => drawer?.classList.contains('open') ? closeDrawer() : openDrawer());
  drawer?.querySelector('.drawer-bg')?.addEventListener('click', closeDrawer);
  drawer?.querySelector('.drawer-close')?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

  const copy = {
    founder: ['Founder access', 'Get early CragLink updates.', 'Join the founder list for prototype updates, field testing, and first production availability.'],
    architecture: ['System architecture', 'Basecamp power architecture', 'A DC-native field system built around efficient charging, durable storage, safe fused wiring, and simple setup at remote basecamp.'],
    search: ['Search', 'Search is coming soon.', 'Use the navigation for now, or join the founder list and we will send product updates directly.']
  };
  function openModal(type = 'founder') {
    if (!modal) return;
    const [eyebrow, title, text] = copy[type] || copy.founder;
    modalEyebrow.textContent = eyebrow;
    modalTitle.textContent = title;
    modalCopy.textContent = text;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    lock(true);
    setTimeout(() => modal.querySelector('input[type="email"]')?.focus(), 80);
  }
  function closeModal() { if (!modal) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); lock(false); }
  document.querySelectorAll('[data-modal]').forEach(el => {
    el.addEventListener('click', event => { event.preventDefault(); openModal(el.dataset.modal); });
    el.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openModal(el.dataset.modal); }});
  });
  modal?.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });

  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.originalText = btn.textContent; btn.textContent = 'Sending…'; }
    });
  });
})();
