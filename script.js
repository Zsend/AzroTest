(() => {
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  const header = document.querySelector('[data-header]');
  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMenu = document.querySelector('[data-nav-menu]');

  function setMenu(open) {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navMenu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setMenu(!isOpen);
    });

    navMenu.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });
  }

  const chips = Array.from(document.querySelectorAll('[data-filter]'));
  const search = document.querySelector('[data-search]');
  const cards = Array.from(document.querySelectorAll('[data-card-grid] .solution-card'));
  const emptyState = document.querySelector('[data-empty-state]');
  let activeFilter = 'all';

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9/+\-. ]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function cardText(card) {
    return normalize(`${card.textContent || ''} ${card.getAttribute('data-tags') || ''}`);
  }

  function applyFilters() {
    const query = normalize(search ? search.value : '');
    let visibleCount = 0;

    cards.forEach((card) => {
      const tags = normalize(card.getAttribute('data-tags'));
      const filterMatch = activeFilter === 'all' || tags.includes(activeFilter);
      const searchMatch = !query || cardText(card).includes(query);
      const visible = filterMatch && searchMatch;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyState) emptyState.hidden = visibleCount !== 0;
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeFilter = chip.getAttribute('data-filter') || 'all';
      chips.forEach((item) => item.classList.toggle('is-active', item === chip));
      applyFilters();
    });
  });

  if (search) search.addEventListener('input', applyFilters);
  applyFilters();

  const briefForm = document.querySelector('[data-brief-form]');
  const copyButton = document.querySelector('[data-copy-brief]');
  const formStatus = document.querySelector('[data-form-status]');

  function getBriefText() {
    const formData = new FormData(briefForm);
    const labels = {
      application: 'Application',
      input: 'Input power',
      output: 'Required output',
      battery: 'Battery chemistry',
      environment: 'Environment',
      volume: 'Volume / timeline',
      notes: 'Notes'
    };

    const lines = ['PowerStream project brief'];
    Object.entries(labels).forEach(([key, label]) => {
      const value = String(formData.get(key) || '').trim();
      if (value) lines.push(`${label}: ${value}`);
    });

    if (lines.length === 1) {
      lines.push('Application:');
      lines.push('Input power:');
      lines.push('Required output:');
      lines.push('Battery chemistry:');
      lines.push('Environment:');
      lines.push('Volume / timeline:');
      lines.push('Notes:');
    }

    lines.push('Contact PowerStream: 801-764-9060');
    return lines.join('\n');
  }

  async function copyBrief() {
    if (!briefForm) return;
    const text = getBriefText();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.setAttribute('readonly', '');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      if (formStatus) formStatus.textContent = 'Project brief copied. Open the contact page or call PowerStream to send it.';
    } catch (error) {
      if (formStatus) formStatus.textContent = 'Copy failed. Select the fields and copy them manually, then call PowerStream.';
    }
  }

  if (copyButton) copyButton.addEventListener('click', copyBrief);

  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const navLinks = Array.from(document.querySelectorAll('.nav__menu a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function setActiveNav() {
    const offset = 140;
    let currentId = sections[0] ? sections[0].id : '';
    sections.forEach((section) => {
      const top = section.getBoundingClientRect().top;
      if (top <= offset) currentId = section.id;
    });

    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${currentId}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  setActiveNav();
  window.addEventListener('scroll', setActiveNav, { passive: true });
})();
