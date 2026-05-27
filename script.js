(function(){
  const doc = document.documentElement;
  const body = document.body;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reduceMotionQuery.matches;
  doc.classList.add('rs-js-ready');

  document.querySelectorAll('[data-year]').forEach(node => {
    node.textContent = new Date().getFullYear();
  });

  const siteHeader = document.querySelector('.site-header');

  // v83: Direction-aware scroll state. Scroll-loaded cards should never
  // visually unload while the customer scrolls upward, but they should reset
  // once they are safely below the viewport so the entrance can replay on the
  // next downward pass. This keeps the motion editorial, controlled, and
  // repeatable without creating slippery reverse animation.
  const getRSScrollY = () => window.scrollY || window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
  let rsLastScrollY = getRSScrollY();
  let rsScrollDirection = 'down';
  const syncRSScrollDirection = () => {
    const y = getRSScrollY();
    if (Math.abs(y - rsLastScrollY) > 0.5) {
      rsScrollDirection = y > rsLastScrollY ? 'down' : 'up';
      rsLastScrollY = y;
    }
    return rsScrollDirection;
  };
  window.addEventListener('scroll', syncRSScrollDirection, { passive: true });
  window.addEventListener('pageshow', () => {
    rsLastScrollY = getRSScrollY();
    rsScrollDirection = 'down';
  });

  // v96 customer-ready build — final mobile matrix repair, precision card connector timing, stronger readability, and production launch fixes.
  // v63: mark exact page links for assistive tech and browser UI quality.
  const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const hrefFile = (href.split('#')[0].split('?')[0] || 'index.html').split('/').pop().toLowerCase();
    if (hrefFile === currentFile && !href.includes('#')) {
      link.setAttribute('aria-current', 'page');
    }
  });

  // v63: light-touch perceived-performance prefetch for internal HTML routes.
  const prefetchedRoutes = new Set();
  const prefetchRoute = (href) => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && (connection.saveData || ['slow-2g', '2g'].includes(connection.effectiveType))) return;
    if (!href || prefetchedRoutes.has(href)) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const cleanHref = href.split('#')[0].split('?')[0];
    if (!cleanHref || (!cleanHref.endsWith('.html') && cleanHref !== './' && cleanHref !== '/')) return;
    prefetchedRoutes.add(href);
    const preload = document.createElement('link');
    preload.rel = 'prefetch';
    preload.href = cleanHref;
    preload.as = 'document';
    document.head.appendChild(preload);
  };
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    link.addEventListener('pointerenter', () => prefetchRoute(href), { once: true, passive: true });
    link.addEventListener('focus', () => prefetchRoute(href), { once: true });
  });

  if (siteHeader && !siteHeader.querySelector('.site-progress-head')) {
    const progressHead = document.createElement('span');
    progressHead.className = 'site-progress-head';
    progressHead.setAttribute('aria-hidden', 'true');
    siteHeader.appendChild(progressHead);
  }

  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  const desktopNavBreakpoint = 1320;

  const syncNavA11y = (isOpen = false) => {
    if (!nav) return;
    if (window.innerWidth <= desktopNavBreakpoint) {
      nav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    } else {
      nav.removeAttribute('aria-hidden');
    }
  };

  const closeNav = (restoreFocus = false) => {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('has-menu-open');
    syncNavA11y(false);
    if (restoreFocus) {
      try { navToggle.focus({ preventScroll: true }); }
      catch (error) { navToggle.focus(); }
    }
  };

  if (nav && navToggle) {
    syncNavA11y(false);

    navToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', willOpen);
      navToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      body.classList.toggle('has-menu-open', willOpen);
      syncNavA11y(willOpen);
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
      if (event.key === 'Escape') closeNav(true);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > desktopNavBreakpoint) closeNav();
      else syncNavA11y(nav.classList.contains('is-open'));
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
      if (status) {
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
      }

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

  // v85: Precision in-page navigation. Native hash jumps target the section
  // wrapper; this site has generous section padding, so default anchors land
  // with too much blank space under the sticky header. Aim each click at the
  // section's readable optical start instead: the intro on light sections and
  // the dark proof panel itself on the proof section. This keeps Why now,
  // Framework, and Proof feeling intentional and consistent.
  const sectionAnchorTarget = (section) => {
    if (!section) return null;
    if (section.id === 'proof') return section.querySelector('.proof-shell') || section;
    return section.querySelector('.section-intro') || section;
  };

  const sectionAnchorGap = () => {
    if (window.innerWidth <= 640) return 24;
    if (window.innerWidth <= 960) return 32;
    return 46;
  };

  const scrollToSectionAnchor = (id, behavior = 'smooth', updateHash = true) => {
    const section = id ? document.getElementById(id) : null;
    const target = sectionAnchorTarget(section);
    if (!target) return false;
    const headerBottom = siteHeader ? siteHeader.getBoundingClientRect().bottom : 0;
    const intro = section.querySelector('.section-intro');
    if (intro) intro.classList.add('is-visible');
    section.querySelectorAll('[data-reveal]').forEach(node => node.classList.add('is-visible'));
    target.classList.add('is-visible');
    const targetY = target.getBoundingClientRect().top + window.scrollY - headerBottom - sectionAnchorGap();
    window.scrollTo({ top: Math.max(0, Math.round(targetY)), behavior: prefersReducedMotion() ? 'auto' : behavior });
    if (updateHash && window.history && window.history.pushState) {
      window.history.pushState(null, '', `#${id}`);
    }
    return true;
  };

  const normalizeInternalHash = (href) => {
    if (!href || !href.includes('#')) return '';
    const [path, hash] = href.split('#');
    if (!hash) return '';
    const cleanPath = (path || '').split('/').pop().toLowerCase();
    const onIndex = currentFile === '' || currentFile === 'index.html';
    const pointsToIndex = !cleanPath || cleanPath === 'index.html';
    return onIndex && pointsToIndex ? hash : '';
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const id = normalizeInternalHash(link.getAttribute('href') || '');
    if (!id || !document.getElementById(id)) return;
    event.preventDefault();
    if (nav && nav.classList.contains('is-open')) closeNav();
    scrollToSectionAnchor(id, 'smooth', true);
  }, true);

  if (window.location.hash) {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id && document.getElementById(id)) {
      window.setTimeout(() => scrollToSectionAnchor(id, 'auto', false), 120);
      window.addEventListener('load', () => window.setTimeout(() => scrollToSectionAnchor(id, 'auto', false), 40), { once: true });
    }
  }

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

  // ---------------------------------------------------------------------
  // v29 — SCROLL-DRIVEN slide-in animation for the three Framework
  // band-cards (Asset / Problem / System). The cards progress from
  // initial state to final state based on the user's scroll position,
  // not on a timer. Each card has a per-card scroll offset so they
  // reveal one after another as the user scrolls down — slow,
  // deliberate fintech motion graphics quality.
  //
  // Direct inline-style mutations (no CSS transitions, no WAAPI) so
  // the animation plays reliably even under prefers-reduced-motion at
  // the OS level — Chrome pauses CSS transitions and WAAPI under that
  // setting, but DOM mutations driven by scroll events always run.
  // ---------------------------------------------------------------------
  const slideInBandCards = [...document.querySelectorAll('.band-grid .band-card')];
  if (slideInBandCards.length) {
    // Strip the global reveal pipeline from these cards so it doesn't
    // mark them is-visible instantly with no animation.
    slideInBandCards.forEach((card) => {
      card.removeAttribute('data-reveal');
      card.classList.remove('is-visible');
      card.style.setProperty('will-change', 'transform, opacity, filter');
    });

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    // Per-card stagger: each card's "effective top" is offset by this
    // many pixels, so card 1 starts animating SCROLL_STAGGER px of
    // scroll AFTER card 0 starts, card 2 starts 2× that after card 0.
    // Asset → Problem → System cadence.
    const SCROLL_STAGGER = 95;

    // Progress = 0 when the card's effective top crosses START_RATIO of
    // viewport height. With START_RATIO > 1.0, animation starts while
    // the card is still slightly BELOW the viewport — anticipatory
    // reveal, classic editorial scroll-storytelling pattern.
    //
    // Progress = 1 when the effective top reaches END_RATIO of viewport
    // height. With END_RATIO = 0.62, the LAST card (System) completes
    // when its actual rect.top ≈ 370 (matches the position in the
    // founder's reference screenshot — cards fully visible, sitting in
    // the lower-middle of the viewport with breathing room above).
    //
    // Range = (1.10 - 0.62) × viewport ≈ 0.48 × vh ≈ 432px on a 900px
    // viewport. Slow, deliberate. Total reveal span ≈ 432 + 2×95 =
    // 622px of scroll for all three cards to land.
    const START_RATIO = 1.10;
    const END_RATIO = 0.62;

    const updateCards = () => {
      syncRSScrollDirection();
      const viewportH = window.innerHeight;
      const startY = viewportH * START_RATIO;
      const endY = viewportH * END_RATIO;
      const range = Math.max(1, startY - endY);

      slideInBandCards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        // Add idx-based offset so the cards stagger by scroll position.
        const effectiveTop = rect.top + idx * SCROLL_STAGGER;
        const raw = (startY - effectiveTop) / range;
        const progress = Math.max(0, Math.min(1, raw));

        // v83: replayable downward reveal. On downward scroll, cards advance
        // through the same scrubbed entrance. On upward scroll, they freeze
        // instead of reverse-fading. Once a card is safely below the viewport
        // again, it resets offscreen so the same premium entrance replays the
        // next time the customer scrolls down.
        let storedProgress = typeof card._rsSlideProgress === 'number'
          ? card._rsSlideProgress
          : progress;
        const resetBelowViewport = effectiveTop > startY + 18;
        if (rsScrollDirection === 'up' && resetBelowViewport) {
          storedProgress = 0;
        } else if (rsScrollDirection === 'down') {
          storedProgress = Math.max(storedProgress, progress);
        }
        card._rsSlideProgress = storedProgress;

        const e = easeOutCubic(storedProgress);
        const isNarrow = window.innerWidth <= 1024;
        const drift = isNarrow ? 0 : (window.innerWidth <= 1024 ? 72 : 140);
        const tx = (1 - e) * drift;
        const ty = isNarrow ? (1 - e) * 16 : 0;
        const sc = 0.96 + e * 0.04;
        const bl = (1 - e) * 10;
        card.style.setProperty('opacity', String(e), 'important');
        card.style.setProperty(
          'transform',
          `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`,
          'important'
        );
        card.style.setProperty('filter', `blur(${bl.toFixed(2)}px)`, 'important');
      });
    };

    // Throttle via a scheduled flag — runs once per scroll/resize burst.
    // setTimeout instead of rAF because rAF is paused under reduce-motion
    // on some platforms; setTimeout always fires.
    let scheduled = false;
    const scheduleUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => { updateCards(); scheduled = false; }, 0);
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('load', scheduleUpdate, { once: true });
    window.addEventListener('pageshow', scheduleUpdate);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleUpdate).catch(() => {});
    }
    window.setTimeout(scheduleUpdate, 120);
    // Initial run so cards are in correct state on page load.
    updateCards();
  }

  let refreshClosingScrollCards = null;

  // ---------------------------------------------------------------------
  // v79 — Closing-card scroll choreography timed to the screenshot point.
  //
  // Desired sequence:
  //   1) Operator Materials loads slowly and deliberately.
  //   2) A short scroll-based pause follows.
  //   3) Next Step begins after that pause and finishes exactly when the row
  //      reaches the founder's screenshot reading position under the sticky
  //      header — not before that point, and not after it.
  //
  // Critical implementation detail: the progress math uses layout top from
  // offsetTop, not getBoundingClientRect().top, because transforms/scale change
  // the bounding rect while the card is animating. That feedback loop is what
  // made earlier versions look early or late. Layout-top progress gives a stable,
  // testable landing point.
  // ---------------------------------------------------------------------
  const closingScrollCards = [...document.querySelectorAll('.download-grid [data-closing-scroll-card]')];
  if (closingScrollCards.length) {
    closingScrollCards.forEach((card) => {
      card.removeAttribute('data-reveal');
      card.classList.remove('is-visible', 'rs-scroll-slide-card', 'is-landed', 'has-scroll-landed', 'is-cta-focus-window', 'is-scroll-paused');
      card.style.setProperty('will-change', 'transform, opacity, filter');
      card.style.setProperty('opacity', '0', 'important');
      card.style.setProperty('transform', 'translate3d(144px, 0, 0) scale(0.9580)', 'important');
      card.style.setProperty('filter', 'blur(10px)', 'important');
    });

    const clamp01 = (value) => Math.max(0, Math.min(1, value));
    const clampPx = (value, min, max) => Math.max(min, Math.min(max, value));
    const easeOutCubicClosing = (t) => 1 - Math.pow(1 - t, 3);

    // A near-linear scroll scrub for the CTA card. This prevents the card from
    // looking fully loaded too early while still feeling smooth and controlled.
    const easeExactArrival = (t) => Math.pow(clamp01(t), 1.10);

    const getHeaderBottom = () => {
      const header = document.querySelector('.site-header');
      if (!header) return 92;
      const rect = header.getBoundingClientRect();
      return Math.max(0, rect.bottom || rect.height || 92);
    };

    const getLayoutTop = (el) => {
      let top = 0;
      let node = el;
      while (node) {
        top += node.offsetTop || 0;
        node = node.offsetParent;
      }
      return top - window.scrollY;
    };

    const progressFromTopPx = (top, startY, endY) => {
      return clamp01((startY - top) / Math.max(1, startY - endY));
    };

    const getDesktopTiming = (viewportH) => {
      const headerBottom = getHeaderBottom();

      // Screenshot-equivalent landing point. In the reference capture, the row
      // is settled when its top sits around 27.5% down the viewport, roughly one
      // calm visual beat below the sticky progress rail. Use both a viewport
      // ratio and the live header height so the finish stays aligned through
      // browser zoom, retina/non-retina captures, and laptop/desktop heights.
      const opticalGap = clampPx(viewportH * 0.10, 54, 112);
      const arrivalY = clampPx(
        Math.max(viewportH * 0.275, headerBottom + opticalGap),
        headerBottom + 46,
        viewportH * 0.34
      );

      const nextStartY = clampPx(
        arrivalY + clampPx(viewportH * 0.26, 160, 260),
        viewportH * 0.50,
        viewportH * 0.72
      );
      const operatorEndY = clampPx(
        nextStartY + clampPx(viewportH * 0.075, 56, 90),
        viewportH * 0.56,
        viewportH * 0.80
      );
      const operatorStartY = viewportH * 1.20;

      return [
        { startY: operatorStartY, endY: operatorEndY, drift: 144, blur: 10, scaleFrom: 0.958, ease: easeOutCubicClosing },
        { startY: nextStartY, endY: arrivalY, drift: 146, blur: 10, scaleFrom: 0.958, ease: easeExactArrival, exactArrivalY: arrivalY }
      ];
    };

    const getStackedTiming = (viewportH, idx) => {
      const headerBottom = getHeaderBottom();
      const opticalGap = clampPx(viewportH * 0.11, 52, 100);
      const arrivalY = clampPx(
        Math.max(viewportH * 0.30, headerBottom + opticalGap),
        headerBottom + 42,
        viewportH * 0.43
      );
      const startY = idx === 0
        ? arrivalY + clampPx(viewportH * 0.34, 160, 260)
        : arrivalY + clampPx(viewportH * 0.29, 140, 230);

      return {
        startY,
        endY: arrivalY,
        drift: window.innerWidth <= 760 ? (idx === 0 ? 34 : 30) : (idx === 0 ? 84 : 78),
        blur: 9,
        scaleFrom: 0.962,
        ease: idx === 0 ? easeOutCubicClosing : easeExactArrival,
        exactArrivalY: idx === 1 ? arrivalY : undefined
      };
    };

    const paintClosingCard = (card, progress, timing, top) => {
      const hasExactArrival = typeof timing.exactArrivalY === 'number';
      const hasArrived = hasExactArrival ? top <= timing.exactArrivalY + 0.75 : progress >= 1;
      const e = hasArrived ? 1 : (timing.ease || easeOutCubicClosing)(progress);

      const isNarrow = window.innerWidth <= 1024;
      const tx = isNarrow ? 0 : (1 - e) * timing.drift;
      const ty = isNarrow ? (1 - e) * 16 : 0;
      const sc = timing.scaleFrom + e * (1 - timing.scaleFrom);
      const bl = (1 - e) * timing.blur;

      card.style.setProperty('opacity', String(e), 'important');
      card.style.setProperty(
        'transform',
        `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`,
        'important'
      );
      card.style.setProperty('filter', `blur(${bl.toFixed(2)}px)`, 'important');
      card.classList.toggle('has-scroll-landed', hasArrived || progress >= 0.995);
    };

    const closingProgressMemory = closingScrollCards.map(() => 0);

    const updateClosingScrollCards = () => {
      const viewportH = window.innerHeight || document.documentElement.clientHeight || 800;
      const firstTop = getLayoutTop(closingScrollCards[0]);
      const secondTop = closingScrollCards[1] ? getLayoutTop(closingScrollCards[1]) : firstTop;
      const isStacked = Math.abs(secondTop - firstTop) > 44;
      const desktopTiming = getDesktopTiming(viewportH);
      syncRSScrollDirection();
      const isScrollingDown = rsScrollDirection !== 'up';

      closingScrollCards.forEach((card, idx) => {
        const top = isStacked ? getLayoutTop(card) : firstTop;
        const timing = isStacked
          ? getStackedTiming(viewportH, idx)
          : (desktopTiming[idx] || desktopTiming[desktopTiming.length - 1]);
        const rawProgress = progressFromTopPx(top, timing.startY, timing.endY);
        const storedProgress = typeof closingProgressMemory[idx] === 'number' ? closingProgressMemory[idx] : rawProgress;

        // v83: replayable down-scroll reveal. Cards advance into place while
        // scrolling down, hold their landed state while scrolling upward
        // through the visible section, then reset only once the row is safely
        // below the viewport. That gives the entrance every time the customer
        // scrolls down again without the cheaper reverse-unload effect when
        // scrolling up.
        const resetBelowViewport = top > viewportH + 36;
        let progress;
        if (resetBelowViewport) {
          progress = 0;
        } else if (isScrollingDown) {
          progress = Math.max(storedProgress, rawProgress);
        } else {
          progress = Math.max(storedProgress, rawProgress);
        }
        if (rawProgress >= 0.995 || (typeof timing.exactArrivalY === 'number' && top <= timing.exactArrivalY + 0.75)) progress = 1;
        progress = clamp01(progress);
        closingProgressMemory[idx] = progress;

        paintClosingCard(card, progress, timing, top);
        card.classList.toggle('is-scroll-paused', !isStacked && idx === 0 && firstTop < desktopTiming[0].endY && firstTop > desktopTiming[1].startY);
        card.classList.toggle('is-cta-focus-window', idx === 1 && progress > 0.10 && progress < 1);
      });
    };

    refreshClosingScrollCards = updateClosingScrollCards;

    let closingScrollScheduled = false;
    const scheduleClosingScrollUpdate = () => {
      if (closingScrollScheduled) return;
      closingScrollScheduled = true;
      setTimeout(() => {
        updateClosingScrollCards();
        closingScrollScheduled = false;
      }, 0);
    };

    window.addEventListener('scroll', updateClosingScrollCards, { passive: true });
    window.addEventListener('resize', scheduleClosingScrollUpdate);
    window.addEventListener('load', scheduleClosingScrollUpdate, { once: true });
    window.addEventListener('pageshow', scheduleClosingScrollUpdate);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleClosingScrollUpdate).catch(() => {});
    }
    window.setTimeout(scheduleClosingScrollUpdate, 80);
    window.setTimeout(scheduleClosingScrollUpdate, 240);
    updateClosingScrollCards();
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

  let whyNowCopy = document.querySelector('#why-now .copy-block');
  if (whyNowCopy && !whyNowCopy.parentElement.classList.contains('copy-rail')) {
    const rail = document.createElement('div');
    rail.className = 'copy-rail';
    whyNowCopy.parentNode.insertBefore(rail, whyNowCopy);
    rail.appendChild(whyNowCopy);
  }
  const syncWhyNowRail = () => {
    const section = document.getElementById('why-now');
    if (!section) return;
    const rail = section.querySelector('.copy-rail');
    const copy = section.querySelector('.copy-rail > .copy-block');
    const target = section.querySelector('.stack-card[data-sequence-card="3"]');
    if (!(rail && copy && target)) return;

    rail.style.removeProperty('height');

    if (window.innerWidth <= 960) {
      rail.style.removeProperty('height');
      return;
    }

    const railTop = rail.getBoundingClientRect().top + window.scrollY;
    const targetBottom = target.getBoundingClientRect().bottom + window.scrollY;
    const railHeight = Math.max(copy.offsetHeight, Math.round(targetBottom - railTop));
    rail.style.height = `${railHeight}px`;
  };
  const scheduleWhyNowRailSync = () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(syncWhyNowRail));
  };

  whyNowCopy = document.querySelector('#why-now .copy-rail > .copy-block') || document.querySelector('#why-now .copy-block');
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
  const rsFooterPanel = document.querySelector('.rs-footer__panel');
  let ticking = false;

  const getProgressFloor = (scrollable) => {
    const fallback = 0.10;
    const whyNow = document.getElementById('why-now');
    if (!whyNow) return fallback;

    const style = window.getComputedStyle(whyNow);
    const scrollMarginTop = parseFloat(style.scrollMarginTop) || 0;
    const targetY = Math.max(0, whyNow.offsetTop - scrollMarginTop);

    // Match the old zero-start rail's visible progress at the “Why this
    // matters now” anchor, while keeping the first impression restrained
    // across unusually short or tall viewports.
    return clamp(targetY / Math.max(1, scrollable), 0.10, 0.28);
  };

  const updateScrollFx = () => {
    ticking = false;
    if (refreshClosingScrollCards) refreshClosingScrollCards();

    const scrollableRaw = doc.scrollHeight - window.innerHeight;
    const scrollable = Math.max(1, scrollableRaw);
    const rawPageProgress = Math.max(0, Math.min(1, window.scrollY / scrollable));

    // v84: restrained ambient light field. The values drive only low-alpha
    // decorative gradients on dark institutional surfaces and the footer;
    // they do not affect layout or card choreography.
    const ambientX = 82 - rawPageProgress * 18;
    const ambientY = 14 + rawPageProgress * 8;
    const ambientGlow = 0.12 + rawPageProgress * 0.035;
    doc.style.setProperty('--rs-ambient-x', `${ambientX.toFixed(2)}%`);
    doc.style.setProperty('--rs-ambient-y', `${ambientY.toFixed(2)}%`);
    doc.style.setProperty('--rs-ambient-glow', ambientGlow.toFixed(3));

    if (rsFooterPanel) {
      const footerRect = rsFooterPanel.getBoundingClientRect();
      const footerRaw = clamp((window.innerHeight - footerRect.top) / Math.max(1, window.innerHeight * 0.95));
      const footerEase = 1 - Math.pow(1 - footerRaw, 3);
      rsFooterPanel.style.setProperty('--rs-footer-progress', footerEase.toFixed(3));
      rsFooterPanel.style.setProperty('--rs-footer-light-x', `${(88 - footerEase * 18).toFixed(2)}%`);
      rsFooterPanel.style.setProperty('--rs-footer-light-y', `${(8 + footerEase * 10).toFixed(2)}%`);
      rsFooterPanel.style.setProperty('--rs-footer-glow', (0.12 + footerEase * 0.06).toFixed(3));
      rsFooterPanel.style.setProperty('--rs-footer-drift-x', `${(-8 * footerEase).toFixed(2)}px`);
      rsFooterPanel.style.setProperty('--rs-footer-drift-y', `${(4 * footerEase).toFixed(2)}px`);
    }

    const progressFloor = getProgressFloor(scrollable);
    const isAtEnd = scrollableRaw <= 1 || (window.scrollY + window.innerHeight >= doc.scrollHeight - 2);
    const pageProgress = isAtEnd
      ? 1
      : Math.max(progressFloor, Math.min(1, progressFloor + rawPageProgress * (1 - progressFloor)));

    const railFeatherBase = Math.max(16, Math.min(30, window.innerWidth * 0.0185));
    const railFeatherTaper = isAtEnd ? 0 : Math.max(0, Math.min(1, (1 - rawPageProgress) / 0.04));
    const railFeatherFull = railFeatherBase * railFeatherTaper;
    const railFeatherMid = Math.max(0, railFeatherFull * 0.50);

    doc.style.setProperty('--page-progress-raw', rawPageProgress.toFixed(4));
    doc.style.setProperty('--page-progress-floor', progressFloor.toFixed(4));
    doc.style.setProperty('--page-progress', pageProgress.toFixed(4));
    doc.style.setProperty('--page-progress-pct', `${(pageProgress * 100).toFixed(2)}%`);
    doc.style.setProperty('--rs-progress-feather-full', `${railFeatherFull.toFixed(2)}px`);
    doc.style.setProperty('--rs-progress-feather-mid', `${railFeatherMid.toFixed(2)}px`);
    body.classList.toggle('is-scrolled', window.scrollY > 20);
    body.classList.toggle('is-progress-complete', isAtEnd || pageProgress >= 0.999);

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
          // v83: downward-only, repeatable reveal. Asset / Problem / System
          // cards advance while scrolling down, hold while scrolling up through
          // the visible section, and reset once the section is backed above its
          // entry window so the next downward pass replays cleanly.
          let cardProgress = typeof card._rsDirectionalBandProgress === 'number'
            ? card._rsDirectionalBandProgress
            : bandProgress;
          if (rsScrollDirection === 'up' && bandProgress <= 0.002) {
            cardProgress = 0;
          } else if (rsScrollDirection === 'down') {
            cardProgress = Math.max(cardProgress, bandProgress);
          }
          card._rsDirectionalBandProgress = cardProgress;
          card.style.setProperty('--band-progress', cardProgress.toFixed(3));
        });
      }

      if (section.id === 'process') {
        // v96: process line is tied to the card row and completes while
        // all four cards are still clearly inside the reading field. The
        // connector should never feel like it is chasing the last card off
        // screen; it becomes complete as the row arrives, then the card
        // content continues to settle.
        let processProgress = ramp(progress, 0.018, 0.18);
        if (processGrid) {
          const gridRect = processGrid.getBoundingClientRect();
          const gridStart = window.innerHeight * 0.94;
          const gridEnd = window.innerHeight * 0.66;
          const gridProgress = clamp((gridStart - gridRect.top) / Math.max(1, gridStart - gridEnd));
          processProgress = Math.max(processProgress, gridProgress);
        }
        const processSweep = processProgress;
        section.style.setProperty('--process-progress', processProgress.toFixed(3));
        if (processGrid) processGrid.style.setProperty('--process-sweep', processSweep.toFixed(3));
        processCards.forEach((card, idx) => {
          const stepProgress = ramp(processProgress, idx * 0.115, 0.30);
          card.style.setProperty('--process-card-progress', stepProgress.toFixed(3));
        });
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        activeIndex = index;
      }
    });

    const sections = [...document.querySelectorAll('.section[id]')];
    const firstTrackedSection = sections[0];
    if (firstTrackedSection && firstTrackedSection.getBoundingClientRect().top > window.innerHeight * 0.64) {
      activeIndex = -1;
    }
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
        if (isActive) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      });
    }

    if (navSectionLinks.length) {
      navSectionLinks.forEach(item => {
        item.link.classList.remove('is-active');
        item.link.removeAttribute('aria-current');
      });
      if (activeIndex >= 0 && navSectionLinks[activeIndex]) {
        navSectionLinks[activeIndex].link.classList.add('is-active');
        navSectionLinks[activeIndex].link.setAttribute('aria-current', 'location');
      }
    }
  };

  const requestScrollFx = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollFx);
  };

  scheduleWhyNowRailSync();
  window.addEventListener('load', () => {
    scheduleWhyNowRailSync();
    requestScrollFx();
  });
  window.addEventListener('scroll', requestScrollFx, { passive: true });
  window.addEventListener('resize', () => {
    scheduleWhyNowRailSync();
    requestScrollFx();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      scheduleWhyNowRailSync();
      requestScrollFx();
    }).catch(() => {});
    document.fonts.addEventListener?.('loadingdone', () => {
      scheduleWhyNowRailSync();
      requestScrollFx();
    });
  }
  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener('change', requestScrollFx);
  }
  requestScrollFx();
})();
