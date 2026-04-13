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
  const chapterDock = document.querySelector('[data-chapter-dock]');
  const chapterDockNumber = chapterDock ? chapterDock.querySelector('[data-chapter-number]') : null;
  const chapterDockTitle = chapterDock ? chapterDock.querySelector('[data-chapter-title]') : null;
  const chapterDockKicker = chapterDock ? chapterDock.querySelector('[data-chapter-kicker]') : null;

  const sectionsById = [...document.querySelectorAll('.section[id]')].map(el => ({
    el,
    id: el.id,
    number: el.getAttribute('data-chapter-num') || '',
    label: el.getAttribute('data-chapter-label') || '',
    title: el.getAttribute('data-chapter-title') || ''
  }));

  const chapterSections = sectionsById.map(item => {
    const link = chapterLinks.find(candidate => candidate.getAttribute('data-rail-target') === item.id) || null;
    return { ...item, link };
  });

  let activeSectionIndex = -1;
  let activeSectionId = '';
  let lastDockIndex = -1;

  const updateChapterDock = (index) => {
    if (!chapterDock || index < 0 || !chapterSections[index]) return;
    const item = chapterSections[index];
    if (lastDockIndex !== index) {
      chapterDock.classList.remove('is-transitioning');
      // force reflow so the animation can replay
      void chapterDock.offsetWidth;
      chapterDock.classList.add('is-transitioning');
      lastDockIndex = index;
    }
    if (chapterDockNumber) chapterDockNumber.textContent = item.number || String(index + 1).padStart(2, '0');
    if (chapterDockTitle) chapterDockTitle.textContent = item.label || item.title || item.id;
    if (chapterDockKicker) chapterDockKicker.textContent = 'Current chapter';
  };

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

    chapterSections.forEach((item, index) => {
      const section = item.el;
      const rect = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - viewportCenter);
      const intensity = Math.max(0, 1 - distance / (window.innerHeight * 0.82));
      const progress = Math.max(0, Math.min(1, (viewportCenter - rect.top) / Math.max(1, rect.height)));
      const edgeIn = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / Math.max(1, window.innerHeight * 0.95)));
      const edgeOut = Math.max(0, Math.min(1, rect.bottom / Math.max(1, window.innerHeight * 0.88)));
      const chapterStrength = Math.max(0, Math.min(1, Math.min(edgeIn, edgeOut) * 1.05));
      const enterStart = window.innerHeight * 0.92;
      const enterEnd = window.innerHeight * 0.22;
      const enterTravel = Math.max(1, enterStart - enterEnd);
      const enterProgress = Math.max(0, Math.min(1, (enterStart - rect.top) / enterTravel));
      const exitStrength = Math.max(0, Math.min(1, rect.bottom / Math.max(1, window.innerHeight * 0.84)));
      const sectionEnter = Math.max(0, Math.min(1, Math.min(enterProgress, exitStrength)));
      const sectionSeam = Math.max(0, Math.min(1, Math.min(progress * 1.12, sectionEnter * 1.06)));
      const surfaceY = ((1 - intensity) * 16 - intensity * 6).toFixed(2);
      const surfaceScale = (0.99 + intensity * 0.01).toFixed(4);
      const shadowAlpha = (0.07 + intensity * 0.08).toFixed(3);
      const borderAlpha = (0.09 + intensity * 0.10).toFixed(3);

      section.style.setProperty('--section-focus', intensity.toFixed(3));
      section.style.setProperty('--section-progress', progress.toFixed(3));
      section.style.setProperty('--section-enter', sectionEnter.toFixed(3));
      section.style.setProperty('--section-seam', sectionSeam.toFixed(3));
      section.style.setProperty('--section-chapter-strength', chapterStrength.toFixed(3));
      section.style.setProperty('--section-surface-y', `${surfaceY}px`);
      section.style.setProperty('--section-surface-scale', surfaceScale);
      section.style.setProperty('--section-shadow-alpha', shadowAlpha);
      section.style.setProperty('--section-border-alpha', borderAlpha);

      if (distance < bestDistance) {
        bestDistance = distance;
        activeIndex = index;
      }
    });

    chapterSections.forEach((item, index) => {
      const section = item.el;
      const isActive = index === activeIndex;
      const isPast = activeIndex > index;
      section.classList.toggle('is-active', isActive);
      section.classList.toggle('is-past', isPast);
    });

    if (chapterSections.length) {
      const firstTop = chapterSections[0].el.offsetTop;
      const lastBottom = chapterSections[chapterSections.length - 1].el.offsetTop + chapterSections[chapterSections.length - 1].el.offsetHeight;
      const railAnchor = window.scrollY + viewportCenter;
      const railProgress = Math.max(0, Math.min(1, (railAnchor - firstTop) / Math.max(1, lastBottom - firstTop - window.innerHeight * 0.38)));
      if (chapterRail) chapterRail.style.setProperty('--rail-progress', railProgress.toFixed(4));
      if (chapterDock) chapterDock.style.setProperty('--dock-progress', railProgress.toFixed(4));

      chapterSections.forEach((item, index) => {
        const isActive = index === activeIndex;
        const isPast = activeIndex > index;
        if (item.link) {
          item.link.classList.toggle('is-active', isActive);
          item.link.classList.toggle('is-past', isPast);
        }
      });
    }

    if (activeIndex >= 0 && chapterSections[activeIndex]) {
      activeSectionIndex = activeIndex;
      activeSectionId = chapterSections[activeIndex].id;
      body.dataset.activeSection = activeSectionId;
      updateChapterDock(activeIndex);
    }

    body.classList.toggle('is-dock-visible', window.scrollY > Math.max(72, window.innerHeight * 0.12));

    if (navSectionLinks.length) {
      navSectionLinks.forEach(item => item.link.classList.remove('is-active'));
      const activeSection = activeIndex >= 0 ? chapterSections[activeIndex]?.el : null;
      const activeNav = activeSection ? navSectionLinks.find(item => item.el === activeSection) : null;
      if (activeNav) activeNav.link.classList.add('is-active');
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
