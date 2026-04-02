(function () {
  const body = document.body;
  const header = document.getElementById('site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];

  function closeNav() {
    if (!nav || !navToggle) return;
    navToggle.setAttribute('aria-expanded', 'false');
    header?.classList.remove('nav-open');
    body.classList.remove('nav-open');
  }

  function openNav() {
    if (!nav || !navToggle) return;
    navToggle.setAttribute('aria-expanded', 'true');
    header?.classList.add('nav-open');
    body.classList.add('nav-open');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeNav();
      else openNav();
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeNav();
      });
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!target || !(target instanceof Element)) return;
      if (!header?.classList.contains('nav-open')) return;
      if (header.contains(target)) return;
      closeNav();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
  }

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const sectionMap = navLinks
    .map((link) => {
      const id = link.getAttribute('href');
      if (!id || id === '#top') return null;
      return { link, section: document.querySelector(id) };
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sectionMap.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const match = sectionMap.find((item) => item.section === entry.target);
          if (!match) return;
          if (entry.isIntersecting) {
            navLinks.forEach((link) => link.classList.remove('is-active'));
            match.link.classList.add('is-active');
          }
        });
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: [0, 0.2, 0.6, 1]
      }
    );

    sectionMap.forEach((item) => {
      if (item.section) observer.observe(item.section);
    });
  }

  function track(eventName, props) {
    try {
      if (typeof window.plausible === 'function') {
        window.plausible(eventName, props ? { props } : undefined);
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, props || {});
      }
    } catch (error) {
      // noop
    }
  }

  document.querySelectorAll('[data-track]').forEach((el) => {
    el.addEventListener('click', () => {
      const name = el.getAttribute('data-track');
      if (name) track(name);
    });
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const form = document.getElementById('application-form');
  if (!form) return;

  const status = form.querySelector('.form-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const name = (data.get('name') || '').toString().trim();
    const business = (data.get('business') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();

    if (!name || !business || !email) {
      status.textContent = 'Please add your name, business, and email before creating the application email.';
      return;
    }

    const emailTarget = form.getAttribute('data-contact-email') || 'hello@your-domain.com';
    const lines = [
      'Reserve Standard application',
      '',
      `Name: ${name}`,
      `Business: ${business}`,
      `Email: ${email}`,
      `Monthly reserve budget range: ${(data.get('budget') || '').toString()}`,
      `Current reserve approach: ${(data.get('reserve_approach') || '').toString()}`,
      '',
      'Main objective:',
      (data.get('objective') || '').toString().trim() || '—',
      '',
      'Main concern or constraint:',
      (data.get('constraint') || '').toString().trim() || '—',
      '',
      'Submitted from your-domain.com static Reserve Review form.'
    ];

    const subject = encodeURIComponent(`Reserve Review — ${business}`);
    const body = encodeURIComponent(lines.join('\n'));
    const href = `mailto:${emailTarget}?subject=${subject}&body=${body}`;

    window.location.href = href;
    status.textContent = `Your email app should open with a pre-filled application. If nothing happens, email ${emailTarget} directly.`;
    track('submit_application');
  });
})();