(function(){
  const yearNodes = document.querySelectorAll('[data-year]');
  yearNodes.forEach(node => { node.textContent = new Date().getFullYear(); });

  const body = document.body;
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  const desktopNavBreakpoint = 1320;

  const closeNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('has-menu-open');
  };

  if (nav && navToggle) {
    navToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', willOpen);
      navToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      body.classList.toggle('has-menu-open', willOpen);
    });

    nav.addEventListener('click', (event) => {
      event.stopPropagation();
      const link = event.target.closest('a');
      if (link) closeNav();
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) closeNav();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > desktopNavBreakpoint) closeNav();
    });
  }

  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(reviewForm);
      const name = (data.get('name') || '').toString().trim();
      const business = (data.get('business') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const website = (data.get('website') || '').toString().trim();
      const industry = (data.get('industry') || '').toString().trim();
      const surplus = (data.get('surplus') || '').toString().trim();
      const objective = (data.get('objective') || '').toString().trim();
      const status = reviewForm.querySelector('.form-status');

      if (!name || !business || !email) {
        if (status) status.textContent = 'Please complete your name, business, and email before continuing.';
        return;
      }

      const inbox = (window.RS_CONFIG && window.RS_CONFIG.reviewInbox) ? window.RS_CONFIG.reviewInbox : 'review@reservestandard.com';
      const subject = `Bitcoin Treasury Review — ${business}`;
      const bodyLines = [
        'Reserve Standard — Bitcoin Treasury Review Request',
        '',
        `Name: ${name}`,
        `Business: ${business}`,
        `Email: ${email}`,
        `Website: ${website || 'N/A'}`,
        `Industry: ${industry || 'N/A'}`,
        `Monthly treasury range: ${surplus || 'N/A'}`,
        '',
        'Main objective / current treasury challenge:',
        objective || 'N/A',
        '',
        'Submitted from the Reserve Standard site.'
      ];

      const mailto = `mailto:${encodeURIComponent(inbox)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
      if (status) status.textContent = 'Opening your email client now. If nothing happens, use the direct email link below the form.';
      window.location.href = mailto;
    });
  }
})();
