(function(){
  const doc = document.documentElement;
  const body = document.body;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reduceMotionQuery.matches;

  document.querySelectorAll('[data-year]').forEach(node => {
    node.textContent = new Date().getFullYear();
  });

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
      if (event.target.closest('a')) closeNav();
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

  const chapterRail = document.querySelector('.chapter-rail');
  const chapterLinks = [...document.querySelectorAll('.chapter-rail [data-rail-target]')];
  const sectionLinks = [...document.querySelectorAll('.site-nav a[href^="index.html#"], .site-nav a[href^="#"]')];
  const chapterSections = chapterLinks
    .map(link => {
      const id = link.getAttribute('data-rail-target');
      const el = id ? document.getElementById(id) : null;
      return el ? { link, el, id } : null;
    })
    .filter(Boolean);

  const navSectionLinks = sectionLinks.map(link => {
    const href = link.getAttribute('href') || '';
    const id = href.includes('#') ? href.split('#')[1] : '';
    const el = id ? document.getElementById(id) : null;
    return el ? { link, el } : null;
  }).filter(Boolean);

  const revealNodes = [
    '.hero-copy > *',
    '.hero-stack > *',
    '.section-intro',
    '.copy-block',
    '.stack-card',
    '.matrix-shell',
    '.band-card',
    '.proof-panel',
    '.proof-sidebar',
    '.process-card',
    '.doc-showcase',
    '.review-launch-card',
    '.final-cta',
    '.review-hero > *',
    '.review-side > *',
    '.review-form-shell > *',
    '.article-hero > *',
    '.article > *',
    '.side-card',
    '.cover-frame',
    '.legal-wrap > *',
    '.footer-grid > *',
    '.footer-base > *'
  ].flatMap(selector => [...document.querySelectorAll(selector)]);

  const uniqueReveal = [];
  const revealSet = new Set();
  revealNodes.forEach((node, index) => {
    if (revealSet.has(node)) return;
    revealSet.add(node);
    node.setAttribute('data-reveal', '');
    node.style.setProperty('--reveal-delay', `${(index % 6) * 60}ms`);
    uniqueReveal.push(node);
  });

  if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    uniqueReveal.forEach(node => revealObserver.observe(node));
  } else {
    uniqueReveal.forEach(node => node.classList.add('is-visible'));
  }

  const proofCharts = [...document.querySelectorAll('.path-chart')];
  proofCharts.forEach(chart => {
    chart.querySelectorAll('svg path[stroke^="url("]').forEach(path => {
      path.setAttribute('data-line', '');
      try {
        const len = path.getTotalLength();
        path.style.setProperty('--line-length', `${len}`);
      } catch (error) {
        path.style.setProperty('--line-length', '1');
      }
    });
    chart.querySelectorAll('svg circle').forEach(circle => circle.setAttribute('data-endpoint', ''));
  });


  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const ramp = (progress, start, span) => clamp((progress - start) / Math.max(0.001, span));

  const whyNowCopy = document.querySelector('#why-now .copy-block');
  const whyNowStack = document.querySelector('#why-now .stack-sequence');
  const whyNowCards = [...document.querySelectorAll('#why-now [data-sequence-card]')];
  const frameworkMatrix = document.querySelector('#framework .matrix-shell-animated');
  const frameworkRows = [...document.querySelectorAll('#framework [data-matrix-row]')];
  const frameworkBands = [...document.querySelectorAll('#framework .band-card')];
  const processGrid = document.querySelector('#process .process-grid-animated');
  const processCards = [...document.querySelectorAll('#process [data-process-card]')];

  if (whyNowCopy) whyNowCopy.style.setProperty('--copy-progress', '0');
  if (whyNowStack) whyNowStack.style.setProperty('--stack-sweep', '0');
  if (frameworkMatrix) frameworkMatrix.style.setProperty('--matrix-sweep', '0');
  if (processGrid) processGrid.style.setProperty('--process-sweep', '0');
  whyNowCards.forEach(card => card.style.setProperty('--card-progress', '0'));
  frameworkRows.forEach(row => row.style.setProperty('--row-progress', '0'));
  frameworkBands.forEach(card => card.style.setProperty('--band-progress', '0'));
  processCards.forEach(card => card.style.setProperty('--process-card-progress', '0'));

  if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
    const chartObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-animated');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.42, rootMargin: '0px 0px -4% 0px' });
    proofCharts.forEach(chart => chartObserver.observe(chart));
  } else {
    proofCharts.forEach(chart => chart.classList.add('is-animated'));
  }

  const hero = document.querySelector('.hero');
  let ticking = false;

  const updateScrollFx = () => {
    ticking = false;

    const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
    const pageProgress = Math.max(0, Math.min(1, window.scrollY / scrollable));
    doc.style.setProperty('--page-progress', pageProgress.toFixed(4));
    body.classList.toggle('is-scrolled', window.scrollY > 20);

    if (hero && !prefersReducedMotion()) {
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(1, rect.height * 0.95);
      const heroProgress = Math.max(0, Math.min(1, (0 - rect.top) / travel));
      hero.style.setProperty('--hero-progress', heroProgress.toFixed(4));
    }

    let activeIndex = -1;
    let bestDistance = Infinity;
    const viewportCenter = window.innerHeight / 2;

    document.querySelectorAll('.section[id]').forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - viewportCenter);
      const intensity = Math.max(0, 1 - distance / (window.innerHeight * 0.8));
      const progress = Math.max(0, Math.min(1, (viewportCenter - rect.top) / Math.max(1, rect.height)));
      const surfaceY = ((1 - intensity) * 12 - intensity * 4).toFixed(2);
      const surfaceScale = (0.992 + intensity * 0.008).toFixed(4);
      const shadowAlpha = (0.07 + intensity * 0.07).toFixed(3);
      const borderAlpha = (0.09 + intensity * 0.09).toFixed(3);

      section.style.setProperty('--section-focus', intensity.toFixed(3));
      section.style.setProperty('--section-progress', progress.toFixed(3));
      section.style.setProperty('--section-surface-y', `${surfaceY}px`);
      section.style.setProperty('--section-surface-scale', surfaceScale);
      section.style.setProperty('--section-shadow-alpha', shadowAlpha);
      section.style.setProperty('--section-border-alpha', borderAlpha);

      if (section.id === 'why-now') {
        const copyProgress = ramp(progress, 0.02, 0.5);
        const stackSweep = ramp(progress, 0.06, 0.82);
        if (whyNowCopy) whyNowCopy.style.setProperty('--copy-progress', copyProgress.toFixed(3));
        if (whyNowStack) whyNowStack.style.setProperty('--stack-sweep', stackSweep.toFixed(3));
        whyNowCards.forEach((card, idx) => {
          const start = idx * 0.15;
          const progressWindow = ramp(progress, start + 0.04, 0.34);
          card.style.setProperty('--card-progress', progressWindow.toFixed(3));
        });
      }

      if (section.id === 'framework') {
        const matrixProgress = ramp(progress, 0.02, 0.88);
        const matrixSweep = ramp(progress, 0.06, 0.8);
        section.style.setProperty('--matrix-progress', matrixProgress.toFixed(3));
        if (frameworkMatrix) frameworkMatrix.style.setProperty('--matrix-sweep', matrixSweep.toFixed(3));
        frameworkRows.forEach((row, idx) => {
          const rowProgress = ramp(progress, idx * 0.13 + 0.03, 0.28);
          row.style.setProperty('--row-progress', rowProgress.toFixed(3));
        });
        frameworkBands.forEach((card, idx) => {
          const bandProgress = ramp(progress, 0.34 + idx * 0.1, 0.26);
          card.style.setProperty('--band-progress', bandProgress.toFixed(3));
        });
      }

      if (section.id === 'process') {
        const processLineProgress = ramp(progress, 0.00, 0.54);
        const processSweep = ramp(progress, 0.04, 0.60);
        section.style.setProperty('--process-progress', processLineProgress.toFixed(3));
        if (processGrid) processGrid.style.setProperty('--process-sweep', processSweep.toFixed(3));
        processCards.forEach((card, idx) => {
          const stepProgress = ramp(progress, idx * 0.11 + 0.03, 0.22);
          card.style.setProperty('--process-card-progress', stepProgress.toFixed(3));
        });
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        activeIndex = index;
      }
    });

    const sections = [...document.querySelectorAll('.section[id]')];
    sections.forEach((section, index) => {
      const isActive = index === activeIndex;
      const isPast = activeIndex > index;
      section.classList.toggle('is-active', isActive);
      section.classList.toggle('is-past', isPast);
    });

    if (chapterSections.length) {
      const firstTop = chapterSections[0].el.offsetTop;
      const lastTop = chapterSections[chapterSections.length - 1].el.offsetTop;
      const railAnchor = window.scrollY + viewportCenter;
      const railProgress = Math.max(0, Math.min(1, (railAnchor - firstTop) / Math.max(1, lastTop - firstTop)));
      if (chapterRail) chapterRail.style.setProperty('--rail-progress', railProgress.toFixed(4));

      chapterSections.forEach((item, index) => {
        const isActive = index === activeIndex;
        const isPast = activeIndex > index;
        item.link.classList.toggle('is-active', isActive);
        item.link.classList.toggle('is-past', isPast);
      });
    }

    if (navSectionLinks.length) {
      navSectionLinks.forEach(item => item.link.classList.remove('is-active'));
      if (activeIndex >= 0 && navSectionLinks[activeIndex]) {
        navSectionLinks[activeIndex].link.classList.add('is-active');
      }
    }
  };

  const requestScrollFx = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollFx);
  };

  window.addEventListener('scroll', requestScrollFx, { passive: true });
  window.addEventListener('resize', requestScrollFx);
  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener('change', requestScrollFx);
  }
  requestScrollFx();
})();
