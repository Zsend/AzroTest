(() => {
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const config = window.CRAGLINK_CONFIG || {};
  const modal = $('.modal');
  const drawer = $('.drawer');
  const menuToggle = $('.menu-toggle');
  let lastFocused = null;

  const modalCopy = {
    founder: {
      eyebrow: 'Founder access',
      title: 'Get early CragLink updates.',
      copy: 'Join the founder list for prototype updates, field testing, and first production availability.',
      quick: false
    },
    architecture: {
      eyebrow: 'System architecture',
      title: 'DC-native by design.',
      copy: 'A purpose-built architecture for Starlink Mini: battery, solar input, fused harnessing, vehicle charge readiness, and clean DC output without inverter waste.',
      quick: false
    },
    search: {
      eyebrow: 'Quick links',
      title: 'What are you looking for?',
      copy: 'Jump to the product architecture, field proof, support, or founder access.',
      quick: true
    }
  };

  function emit(name, payload = {}) {
    const event = { event: name, brand: 'CragLink Power', path: location.pathname, ...payload };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
    if (config.debug) console.info('[CragLink event]', event);
  }

  function lockPage(lock) { document.body.classList.toggle('is-locked', Boolean(lock)); }

  function setModalContent(kind) {
    const data = modalCopy[kind] || modalCopy.founder;
    $('#modal-eyebrow') && ($('#modal-eyebrow').textContent = data.eyebrow);
    $('#modal-title') && ($('#modal-title').textContent = data.title);
    $('#modal-copy') && ($('#modal-copy').textContent = data.copy);
    let quick = $('.quick-links', modal || document);
    if (quick) quick.remove();
    if (data.quick && modal) {
      quick = document.createElement('div');
      quick.className = 'quick-links';
      quick.innerHTML = `
        <a href="#systems" data-close>Systems</a>
        <a href="#modules" data-close>Architecture</a>
        <a href="field-team.html">Field team</a>
        <a href="legal.html">Compatibility</a>`;
      $('#modal-copy')?.insertAdjacentElement('afterend', quick);
    }
  }

  function openModal(kind = 'founder') {
    if (!modal) return;
    setModalContent(kind);
    lastFocused = document.activeElement;
    modal.hidden = false;
    modal.dataset.kind = kind;
    lockPage(true);
    emit('modal_open', { kind });
    setTimeout(() => $('.modal-card input, .modal-card button, .quick-links a')?.focus(), 40);
  }

  function openDrawer() {
    if (!drawer) return;
    lastFocused = document.activeElement;
    drawer.hidden = false;
    menuToggle?.setAttribute('aria-expanded', 'true');
    lockPage(true);
    emit('drawer_open');
    setTimeout(() => $('.drawer-panel a, .drawer-panel button')?.focus(), 40);
  }

  function closeOverlays() {
    if (modal) modal.hidden = true;
    if (drawer) drawer.hidden = true;
    menuToggle?.setAttribute('aria-expanded', 'false');
    lockPage(false);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
  }

  function scrollToHash(hash) {
    const target = hash && hash.length > 1 ? $(hash) : null;
    if (!target) return false;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  $$('[data-modal]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      openModal(el.dataset.modal || 'founder');
    });
    if (el.getAttribute('role') === 'button') {
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); openModal(el.dataset.modal || 'founder');
        }
      });
    }
  });

  menuToggle?.addEventListener('click', openDrawer);
  document.addEventListener('click', (event) => {
    const close = event.target.closest('[data-close], .modal-close, .drawer-close');
    if (close) closeOverlays();
    const track = event.target.closest('a,button');
    if (track) emit('click', { label: (track.textContent || track.getAttribute('aria-label') || '').trim().slice(0,80), href: track.getAttribute('href') || '', className: track.className || '' });
  });
  $('.modal-bg')?.addEventListener('click', closeOverlays);
  $$('.drawer a').forEach((anchor) => anchor.addEventListener('click', closeOverlays));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeOverlays(); });

  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (scrollToHash(href)) { event.preventDefault(); closeOverlays(); history.replaceState(null, '', href); }
    });
  });

  const sections = ['systems','modules','accessories','explore','support','about']
    .map((id) => document.getElementById(id)).filter(Boolean);
  const navLinks = $$('.nav a[href^="#"]');
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const active = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${active.target.id}`));
    }, { rootMargin: '-22% 0px -60% 0px', threshold: [0.18, 0.36, 0.62] });
    sections.forEach((section) => observer.observe(section));
  }

  function getUtmFields() {
    const params = new URLSearchParams(location.search);
    const fields = {};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ref'].forEach((key) => {
      if (params.has(key)) fields[key] = params.get(key);
    });
    fields.page = location.pathname;
    fields.user_agent = navigator.userAgent;
    fields.timestamp = new Date().toISOString();
    return fields;
  }

  function ensureHidden(form, name, value) {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
      input = document.createElement('input'); input.type = 'hidden'; input.name = name; form.appendChild(input);
    }
    input.value = value || '';
  }

  function setStatus(form, message, kind = '') {
    let node = form.querySelector('.form-status');
    if (!node) { node = document.createElement('div'); node.className = 'form-status'; form.appendChild(node); }
    node.textContent = message || '';
    node.classList.toggle('is-error', kind === 'error');
    node.classList.toggle('is-ok', kind === 'ok');
  }

  async function postNetlify(form) {
    const data = new FormData(form);
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString()
    });
  }

  async function postEndpoint(form) {
    const payload = Object.fromEntries(new FormData(form).entries());
    return fetch(config.formEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
  }

  async function submitLead(form) {
    const email = form.querySelector('input[type="email"]');
    if (email && !email.checkValidity()) { email.reportValidity ? email.reportValidity() : email.focus(); return; }
    const button = form.querySelector('button[type="submit"], button:not([type])');
    const original = button?.innerHTML || '';
    const formName = form.getAttribute('name') || form.querySelector('input[name="form-name"]')?.value || 'lead';
    Object.entries(getUtmFields()).forEach(([k,v]) => ensureHidden(form, k, v));
    ensureHidden(form, 'lead_form', formName);
    if (button) { button.disabled = true; button.setAttribute('aria-busy','true'); button.innerHTML = 'Sending…'; }
    setStatus(form, 'Submitting your request…');
    emit('lead_submit_start', { form: formName });
    try {
      let response;
      if (config.formEndpoint) response = await postEndpoint(form);
      else if (form.hasAttribute('data-netlify')) response = await postNetlify(form);
      if (response && !response.ok) throw new Error(`Form post failed: ${response.status}`);
      const leads = JSON.parse(localStorage.getItem('craglink-launch-leads') || '[]');
      leads.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('craglink-launch-leads', JSON.stringify(leads.slice(-100)));
      emit('lead_submit_success', { form: formName });
      setStatus(form, 'Success — redirecting…', 'ok');
      setTimeout(() => { window.location.href = form.getAttribute('action') || 'success.html'; }, 350);
    } catch (error) {
      console.warn(error);
      emit('lead_submit_error', { form: formName, message: error.message });
      if (button) { button.disabled = false; button.removeAttribute('aria-busy'); button.innerHTML = original; }
      setStatus(form, 'Could not submit yet. Please try again or email us directly.', 'error');
    }
  }

  $$('form').forEach((form) => {
    if (!form.querySelector('input[name="form-name"]') && form.name) ensureHidden(form, 'form-name', form.name);
    form.addEventListener('submit', (event) => { event.preventDefault(); submitLead(form); });
  });

  if (location.hash) setTimeout(() => scrollToHash(location.hash), 120);
  emit('page_view');
})();

