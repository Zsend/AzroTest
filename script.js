(function () {
  const html = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const stageShell = document.getElementById('stage-shell');
  const stageTrack = document.getElementById('stage-track');
  const panels = Array.from(document.querySelectorAll('.panel'));
  const stageRailLinks = Array.from(document.querySelectorAll('[data-stage-link]'));
  const stageCurrent = document.getElementById('stage-current');
  const stageTotal = document.getElementById('stage-total');
  const applicationForm = document.getElementById('application-form');

  const state = {
    stageMode: false,
    activeIndex: 0,
    animating: false,
    lockUntil: 0,
    scrollTicking: false,
    transitionTimer: 0,
    touchStartY: 0,
    touchArmed: false
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatIndex(value) {
    return String(value + 1).padStart(2, '0');
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function canUseStageMode() {
    return Boolean(stageShell && stageTrack && panels.length > 1)
      && window.innerWidth >= 1024
      && window.innerHeight >= 700
      && !prefersReducedMotion();
  }

  function getHeaderOffset() {
    return header ? header.offsetHeight : 0;
  }

  function setHeaderState() {
    if (!header) return;
    const scrolled = state.stageMode ? state.activeIndex > 0 : (window.scrollY || window.pageYOffset || 0) > 8;
    header.classList.toggle('is-scrolled', scrolled);
  }

  function closeNav() {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', 'false');
    header?.classList.remove('nav-open');
    body.classList.remove('nav-open');
  }

  function openNav() {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', 'true');
    header?.classList.add('nav-open');
    body.classList.add('nav-open');
  }

  function getPanelIndexFromHash(hash) {
    if (!hash || hash === '#top' || hash === '#') return 0;
    const id = hash.replace('#', '');
    return panels.findIndex((panel) => panel.id === id);
  }

  function updateActiveUi(index, options = {}) {
    const safeIndex = clamp(index, 0, Math.max(0, panels.length - 1));
    state.activeIndex = safeIndex;

    panels.forEach((panel, panelIndex) => {
      panel.classList.toggle('is-active', panelIndex === safeIndex);
      panel.setAttribute('aria-hidden', panelIndex === safeIndex ? 'false' : 'true');
    });

    const activeId = panels[safeIndex] ? `#${panels[safeIndex].id}` : '';

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', activeId && link.getAttribute('href') === activeId);
    });

    stageRailLinks.forEach((link) => {
      link.classList.toggle('is-active', activeId && link.getAttribute('href') === activeId);
    });

    if (stageCurrent) stageCurrent.textContent = formatIndex(safeIndex);
    if (stageTotal) stageTotal.textContent = String(panels.length).padStart(2, '0');

    if (state.stageMode && stageTrack) {
      stageTrack.style.transform = `translate3d(0, ${safeIndex * -100}%, 0)`;
      if (options.updateHash !== false && panels[safeIndex]?.id) {
        history.replaceState(null, '', `#${panels[safeIndex].id}`);
      }
    }

    setHeaderState();
  }

  function finishStageAnimation() {
    window.clearTimeout(state.transitionTimer);
    state.transitionTimer = 0;
    state.animating = false;
  }

  function goToPanel(index, options = {}) {
    if (!panels.length) return;

    const safeIndex = clamp(index, 0, panels.length - 1);
    const instant = Boolean(options.instant) || prefersReducedMotion();

    if (state.stageMode) {
      if (!instant && (state.animating || performance.now() < state.lockUntil)) return;
      if (safeIndex === state.activeIndex && !options.force) return;

      state.animating = !instant;
      state.lockUntil = performance.now() + (instant ? 0 : 760);

      if (stageTrack) {
        stageTrack.style.transitionDuration = instant ? '0ms' : '900ms';
      }

      updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });

      if (instant) {
        finishStageAnimation();
        if (stageTrack) stageTrack.style.transitionDuration = '';
        return;
      }

      state.transitionTimer = window.setTimeout(() => {
        finishStageAnimation();
        if (stageTrack) stageTrack.style.transitionDuration = '';
      }, 940);
      return;
    }

    const target = panels[safeIndex];
    if (!target) return;

    const top = Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 2));
    window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
    updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });
  }

  function handleStageWheel(event) {
    if (!state.stageMode || !stageShell) return;
    if (!(event.target instanceof Element) || !stageShell.contains(event.target)) return;
    if (body.classList.contains('nav-open')) return;
    if (event.ctrlKey || event.metaKey) return;
    if (event.target.closest('input, textarea, select, option, [contenteditable="true"], .nav-toggle, details')) return;

    const delta = event.deltaY;
    if (Math.abs(delta) < 5) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    if (state.animating || performance.now() < state.lockUntil) return;

    const direction = delta > 0 ? 1 : -1;
    goToPanel(state.activeIndex + direction);
  }

  function isTypingContext(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeNav();
    }

    if (!state.stageMode || !panels.length || isTypingContext(event.target)) return;

    if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      goToPanel(state.activeIndex + 1);
      return;
    }

    if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      goToPanel(state.activeIndex - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      goToPanel(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      goToPanel(panels.length - 1);
    }
  }

  function handleStageTouchStart(event) {
    if (!state.stageMode || event.touches.length !== 1) return;
    if (event.target instanceof Element && event.target.closest('input, textarea, select, option, [contenteditable="true"]')) return;
    state.touchArmed = true;
    state.touchStartY = event.touches[0].clientY;
  }

  function handleStageTouchMove(event) {
    if (!state.stageMode || !state.touchArmed) return;
    const delta = Math.abs(event.touches[0].clientY - state.touchStartY);
    if (delta > 8) event.preventDefault();
  }

  function handleStageTouchEnd(event) {
    if (!state.stageMode || !state.touchArmed || state.animating || performance.now() < state.lockUntil) {
      state.touchArmed = false;
      return;
    }

    const changedTouch = event.changedTouches && event.changedTouches[0];
    if (!changedTouch) {
      state.touchArmed = false;
      return;
    }

    const delta = state.touchStartY - changedTouch.clientY;
    state.touchArmed = false;

    if (Math.abs(delta) < 42) return;
    goToPanel(state.activeIndex + (delta > 0 ? 1 : -1));
  }

  function updateIndexFromScroll() {
    if (state.stageMode || !panels.length) return;
    const probe = window.scrollY + getHeaderOffset() + window.innerHeight * 0.28;
    let activeIndex = 0;

    panels.forEach((panel, index) => {
      const top = panel.offsetTop;
      if (top <= probe) activeIndex = index;
    });

    updateActiveUi(activeIndex, { updateHash: false });
  }

  function handleWindowScroll() {
    if (state.stageMode) return;
    if (state.scrollTicking) return;
    state.scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateIndexFromScroll();
      setHeaderState();
      state.scrollTicking = false;
    });
  }

  function attachAnchorHandling() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        if (href === '#top') {
          event.preventDefault();
          closeNav();
          goToPanel(0, { force: true });
          return;
        }

        const target = document.querySelector(href);
        if (!target) return;
        if (!panels.includes(target)) {
          closeNav();
          return;
        }

        event.preventDefault();
        closeNav();
        goToPanel(panels.indexOf(target), { force: true });
      });
    });
  }

  function syncMode() {
    const nextStageMode = canUseStageMode();

    if (nextStageMode === state.stageMode) {
      if (nextStageMode && stageTrack) {
        stageTrack.style.transform = `translate3d(0, ${state.activeIndex * -100}%, 0)`;
      }
      setHeaderState();
      return;
    }

    state.stageMode = nextStageMode;
    html.classList.toggle('is-stage-mode', nextStageMode);
    body.classList.toggle('is-stage-mode', nextStageMode);
    finishStageAnimation();
    state.lockUntil = 0;

    if (nextStageMode) {
      const hashIndex = getPanelIndexFromHash(window.location.hash);
      if (hashIndex >= 0) state.activeIndex = hashIndex;
      if (stageTrack) {
        stageTrack.style.transitionDuration = '0ms';
        stageTrack.style.transform = `translate3d(0, ${state.activeIndex * -100}%, 0)`;
        window.requestAnimationFrame(() => {
          if (stageTrack) stageTrack.style.transitionDuration = '';
        });
      }
      window.scrollTo(0, 0);
      updateActiveUi(state.activeIndex, { updateHash: false });
      return;
    }

    if (stageTrack) {
      stageTrack.style.transitionDuration = '';
      stageTrack.style.transform = '';
    }

    const target = panels[state.activeIndex];
    const top = target ? Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 2)) : 0;
    window.scrollTo(0, top);
    updateIndexFromScroll();
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

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeNav();
      else openNav();
    });

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (!header?.classList.contains('nav-open')) return;
      if (header.contains(event.target)) return;
      closeNav();
    });
  }

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', syncMode);
  window.addEventListener('orientationchange', syncMode);
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  window.addEventListener('hashchange', () => {
    const hashIndex = getPanelIndexFromHash(window.location.hash);
    if (hashIndex < 0) return;
    if (state.stageMode) {
      goToPanel(hashIndex, { force: true, instant: true, updateHash: false });
    } else {
      updateIndexFromScroll();
    }
  });

  if (stageShell) {
    stageShell.addEventListener('wheel', handleStageWheel, { passive: false });
    stageShell.addEventListener('touchstart', handleStageTouchStart, { passive: true });
    stageShell.addEventListener('touchmove', handleStageTouchMove, { passive: false });
    stageShell.addEventListener('touchend', handleStageTouchEnd, { passive: true });
  }

  attachAnchorHandling();

  document.querySelectorAll('[data-track]').forEach((element) => {
    element.addEventListener('click', () => {
      const name = element.getAttribute('data-track');
      if (name) track(name);
    });
  });

  if (stageTotal) stageTotal.textContent = String(panels.length).padStart(2, '0');

  syncMode();
  updateIndexFromScroll();
  setHeaderState();

  window.addEventListener('load', () => {
    const hashIndex = getPanelIndexFromHash(window.location.hash);
    if (hashIndex >= 0) {
      goToPanel(hashIndex, { force: true, instant: true, updateHash: false });
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  if (!applicationForm) return;

  const status = applicationForm.querySelector('.form-status');

  applicationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(applicationForm);
    const name = (data.get('name') || '').toString().trim();
    const business = (data.get('business') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();

    if (!name || !business || !email) {
      if (status) status.textContent = 'Please add your name, business, and email before creating the application email.';
      return;
    }

    const emailTarget = applicationForm.getAttribute('data-contact-email') || 'hello@your-domain.com';
    const subject = encodeURIComponent(`Reserve Review — ${business}`);
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
      'Submitted from your-domain.com static Reserve Review form.'
    ];

    window.location.href = `mailto:${emailTarget}?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;

    if (status) {
      status.textContent = `Your email app should open with a pre-filled application. If nothing happens, email ${emailTarget} directly.`;
    }

    track('submit_application');
  });
})();
