
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
  const applicationForm = document.getElementById('application-form');

  const STAGE_MIN_WIDTH = 1024;
  const STAGE_MIN_HEIGHT = 680;
  const TRANSITION_MS = 1180;
  const POST_LOCK_MS = 560;
  const MOMENTUM_GUARD_MS = 180;
  const WHEEL_TRIGGER = 42;
  const WHEEL_RESET_MS = 160;
  const TOUCH_TRIGGER = 48;

  const state = {
    stageMode: false,
    activeIndex: 0,
    animating: false,
    lockUntil: 0,
    transitionTimer: 0,
    wheelAccum: 0,
    lastWheelTs: 0,
    touchStartY: 0,
    touchArmed: false,
    scrollTicking: false
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function stageDuration() {
    return prefersReducedMotion() ? 0 : TRANSITION_MS;
  }

  function canUseStageMode() {
    return Boolean(stageShell && stageTrack && panels.length > 1)
      && window.innerWidth >= STAGE_MIN_WIDTH
      && window.innerHeight >= STAGE_MIN_HEIGHT;
  }

  function getHeaderOffset() {
    return header ? Math.round(header.getBoundingClientRect().height || header.offsetHeight || 76) : 76;
  }

  function setViewportMetrics() {
    const headerHeight = getHeaderOffset();
    html.style.setProperty('--header-h', `${headerHeight}px`);
  }

  function closeNav() {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', 'false');
    header && header.classList.remove('nav-open');
    body.classList.remove('nav-open');
  }

  function openNav() {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', 'true');
    header && header.classList.add('nav-open');
    body.classList.add('nav-open');
  }

  function isTypingContext(target) {
    return target instanceof Element && Boolean(
      target.closest('input, textarea, select, option, [contenteditable="true"], details, dialog')
    );
  }

  function getPanelIndexFromHash(hash) {
    if (!hash || hash === '#top' || hash === '#') return 0;
    const id = hash.replace('#', '');
    return panels.findIndex((panel) => panel.id === id);
  }

  function safelyReplaceHash(id) {
    if (!id) return;
    try {
      history.replaceState(null, '', `#${id}`);
    } catch (error) {
      // Ignore history errors on restricted file-like contexts.
    }
  }

  function updateActiveUi(index, options = {}) {
    const safeIndex = clamp(index, 0, Math.max(0, panels.length - 1));
    state.activeIndex = safeIndex;
    const activePanel = panels[safeIndex];
    const activeId = activePanel ? `#${activePanel.id}` : '';

    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === safeIndex;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    navLinks.forEach((link) => {
      const active = Boolean(activeId) && link.getAttribute('href') === activeId;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (state.stageMode && stageTrack) {
      stageTrack.style.transform = `translate3d(0, ${safeIndex * -100}%, 0)`;
    }

    if (options.updateHash !== false && activePanel && activePanel.id) {
      safelyReplaceHash(activePanel.id);
    }

    setHeaderState();
  }

  function setHeaderState() {
    if (!header) return;
    const scrolled = state.stageMode ? state.activeIndex > 0 : (window.scrollY || window.pageYOffset || 0) > 8;
    header.classList.toggle('is-scrolled', scrolled);
  }

  function finishStageAnimation() {
    window.clearTimeout(state.transitionTimer);
    state.transitionTimer = 0;
    state.animating = false;
  }

  function armMomentumGuard() {
    state.lockUntil = Math.max(state.lockUntil, performance.now() + MOMENTUM_GUARD_MS);
  }

  function scrollWindowToPanel(index, instant, updateHash) {
    const panel = panels[index];
    if (!panel) return;
    const top = Math.max(0, Math.round(panel.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 2));
    window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
    updateActiveUi(index, { updateHash });
  }

  function goToPanel(index, options = {}) {
    if (!panels.length) return;

    const safeIndex = clamp(index, 0, panels.length - 1);
    const instant = Boolean(options.instant) || stageDuration() === 0;
    const force = Boolean(options.force);
    const updateHash = options.updateHash !== false;

    if (!state.stageMode) {
      scrollWindowToPanel(safeIndex, instant, updateHash);
      return;
    }

    if (!stageTrack) return;
    if (!force && (state.animating || performance.now() < state.lockUntil)) return;

    if (safeIndex === state.activeIndex && !force) {
      state.lockUntil = performance.now() + 160;
      return;
    }

    finishStageAnimation();

    const duration = instant ? 0 : stageDuration();
    state.animating = duration > 0;
    state.lockUntil = performance.now() + duration + POST_LOCK_MS;

    stageTrack.style.transitionDuration = `${duration}ms`;
    stageTrack.style.transitionTimingFunction = 'cubic-bezier(.22, 1, .36, 1)';

    updateActiveUi(safeIndex, { updateHash });

    if (!duration) {
      finishStageAnimation();
      return;
    }

    state.transitionTimer = window.setTimeout(() => {
      finishStageAnimation();
      state.lockUntil = performance.now() + POST_LOCK_MS;
    }, duration + 40);
  }

  function handleStageWheel(event) {
    if (!state.stageMode || !panels.length) return;
    if (body.classList.contains('nav-open')) return;
    if (event.ctrlKey || event.metaKey) return;
    if (isTypingContext(event.target)) return;

    const primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(primaryDelta) < 1) return;

    event.preventDefault();

    const now = performance.now();
    if (state.animating || now < state.lockUntil) {
      state.wheelAccum = 0;
      state.lastWheelTs = now;
      armMomentumGuard();
      return;
    }

    if (now - state.lastWheelTs > WHEEL_RESET_MS) {
      state.wheelAccum = 0;
    }

    state.lastWheelTs = now;
    state.wheelAccum += primaryDelta;

    if (Math.abs(state.wheelAccum) < WHEEL_TRIGGER) return;

    const direction = state.wheelAccum > 0 ? 1 : -1;
    state.wheelAccum = 0;
    goToPanel(state.activeIndex + direction);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') closeNav();
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
      goToPanel(0, { force: true });
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      goToPanel(panels.length - 1, { force: true });
    }
  }

  function handleStageTouchStart(event) {
    if (!state.stageMode || event.touches.length !== 1) return;
    if (isTypingContext(event.target)) return;
    state.touchArmed = true;
    state.touchStartY = event.touches[0].clientY;
  }

  function handleStageTouchMove(event) {
    if (!state.stageMode || !state.touchArmed) return;
    const delta = Math.abs(event.touches[0].clientY - state.touchStartY);
    if (delta > 8) event.preventDefault();
  }

  function handleStageTouchEnd(event) {
    if (!state.stageMode || !state.touchArmed) {
      state.touchArmed = false;
      return;
    }

    const changedTouch = event.changedTouches && event.changedTouches[0];
    state.touchArmed = false;

    if (!changedTouch) return;
    if (state.animating || performance.now() < state.lockUntil) return;

    const delta = state.touchStartY - changedTouch.clientY;
    if (Math.abs(delta) < TOUCH_TRIGGER) return;

    goToPanel(state.activeIndex + (delta > 0 ? 1 : -1));
  }

  function updateIndexFromScroll() {
    if (state.stageMode || !panels.length) return;
    const probe = window.scrollY + getHeaderOffset() + window.innerHeight * 0.28;
    let activeIndex = 0;

    panels.forEach((panel, index) => {
      if (panel.offsetTop <= probe) activeIndex = index;
    });

    updateActiveUi(activeIndex, { updateHash: false });
  }

  function handleWindowScroll() {
    if (state.stageMode || state.scrollTicking) return;
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
    setViewportMetrics();
    const nextStageMode = canUseStageMode();

    if (nextStageMode === state.stageMode) {
      if (nextStageMode && stageTrack) {
        stageTrack.style.transform = `translate3d(0, ${state.activeIndex * -100}%, 0)`;
      }
      setHeaderState();
      return;
    }

    finishStageAnimation();
    state.stageMode = nextStageMode;
    state.lockUntil = 0;
    state.wheelAccum = 0;
    state.lastWheelTs = 0;

    html.classList.toggle('is-stage-mode', nextStageMode);
    body.classList.toggle('is-stage-mode', nextStageMode);

    if (nextStageMode) {
      const hashIndex = getPanelIndexFromHash(window.location.hash);
      if (hashIndex >= 0) {
        state.activeIndex = hashIndex;
      }

      window.scrollTo(0, 0);
      if (stageTrack) {
        stageTrack.style.transitionDuration = '0ms';
        stageTrack.style.transform = `translate3d(0, ${state.activeIndex * -100}%, 0)`;
        window.requestAnimationFrame(() => {
          if (stageTrack) stageTrack.style.transitionDuration = `${stageDuration()}ms`;
        });
      }
      updateActiveUi(state.activeIndex, { updateHash: false });
      return;
    }

    if (stageTrack) {
      stageTrack.style.transitionDuration = '0ms';
      stageTrack.style.transform = '';
      window.requestAnimationFrame(() => {
        if (stageTrack) stageTrack.style.transitionDuration = '';
      });
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
      if (!(header && header.classList.contains('nav-open'))) return;
      if (header.contains(event.target)) return;
      closeNav();
    });
  }

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', syncMode);
  window.addEventListener('orientationchange', syncMode);
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  window.addEventListener('wheel', handleStageWheel, { passive: false, capture: true });

  if (stageShell) {
    stageShell.addEventListener('touchstart', handleStageTouchStart, { passive: true });
    stageShell.addEventListener('touchmove', handleStageTouchMove, { passive: false });
    stageShell.addEventListener('touchend', handleStageTouchEnd, { passive: true });
  }

  window.addEventListener('hashchange', () => {
    const hashIndex = getPanelIndexFromHash(window.location.hash);
    if (hashIndex < 0) return;

    if (state.stageMode) {
      goToPanel(hashIndex, { force: true, instant: true, updateHash: false });
    } else {
      updateIndexFromScroll();
    }
  });

  attachAnchorHandling();

  document.querySelectorAll('[data-track]').forEach((element) => {
    element.addEventListener('click', () => {
      const name = element.getAttribute('data-track');
      if (name) track(name);
    });
  });

  syncMode();
  updateIndexFromScroll();
  setHeaderState();

  window.addEventListener('load', () => {
    syncMode();
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
