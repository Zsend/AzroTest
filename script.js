(function () {
  const html = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const stageShell = document.getElementById('stage-shell');
  const panels = Array.from(document.querySelectorAll('.panel'));
  const applicationForm = document.getElementById('application-form');

  const STAGE_MIN_WIDTH = 1120;
  const STAGE_MIN_HEIGHT = 720;
  const WHEEL_THRESHOLD = 34;
  const WHEEL_RESET_MS = 140;
  const TOUCH_THRESHOLD = 54;
  const STAGE_DURATION = 920;
  const POST_LOCK_MS = 280;
  const SETTLE_DELAY_MS = 120;

  const state = {
    stageMode: false,
    activeIndex: 0,
    animating: false,
    lockUntil: 0,
    wheelAccum: 0,
    lastWheelTs: 0,
    touchStartY: 0,
    touchArmed: false,
    scrollTicking: false,
    frameId: 0,
    settleTimer: 0
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function hasFinePointer() {
    return window.matchMedia('(pointer: fine)').matches || window.matchMedia('(any-pointer: fine)').matches;
  }

  function canUseStageMode() {
    return Boolean(stageShell && panels.length > 1)
      && window.innerWidth >= STAGE_MIN_WIDTH
      && window.innerHeight >= STAGE_MIN_HEIGHT
      && hasFinePointer()
      && !prefersReducedMotion();
  }

  function getHeaderOffset() {
    return header ? Math.round(header.offsetHeight) : 0;
  }

  function setViewportMetrics() {
    const headerHeight = getHeaderOffset() || 76;
    const stageHeight = Math.max(0, window.innerHeight - headerHeight);

    html.style.setProperty('--header-h', `${headerHeight}px`);
    html.style.setProperty('--stage-h', `${stageHeight}px`);

    html.classList.toggle('is-short-height', window.innerHeight < 920);
    html.classList.toggle('is-compact-height', window.innerHeight < 840);
    html.classList.toggle('is-tight-height', window.innerHeight < 760);
  }

  function setHeaderState() {
    if (!header) return;
    const scrolled = state.stageMode
      ? state.activeIndex > 0 || (stageShell ? stageShell.scrollTop > 4 : false)
      : (window.scrollY || window.pageYOffset || 0) > 8;
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

  function getPanelTop(index) {
    const panel = panels[index];
    return panel ? Math.round(panel.offsetTop) : 0;
  }

  function getNearestPanelIndex(scrollTop) {
    if (!panels.length) return 0;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    panels.forEach((panel, index) => {
      const distance = Math.abs(panel.offsetTop - scrollTop);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  function isTypingContext(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, option, [contenteditable="true"]'));
  }

  function updateActiveUi(index, options = {}) {
    const safeIndex = clamp(index, 0, Math.max(0, panels.length - 1));
    state.activeIndex = safeIndex;

    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === safeIndex;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    const activeId = panels[safeIndex] ? `#${panels[safeIndex].id}` : '';

    navLinks.forEach((link) => {
      const active = Boolean(activeId) && link.getAttribute('href') === activeId;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (options.updateHash !== false && panels[safeIndex]?.id) {
      history.replaceState(null, '', `#${panels[safeIndex].id}`);
    }

    setHeaderState();
  }

  function stopStageAnimation() {
    if (state.frameId) {
      window.cancelAnimationFrame(state.frameId);
      state.frameId = 0;
    }
    window.clearTimeout(state.settleTimer);
    state.settleTimer = 0;
    state.animating = false;
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
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
    const instant = Boolean(options.instant) || prefersReducedMotion();
    const force = Boolean(options.force);
    const updateHash = options.updateHash !== false;

    if (!state.stageMode) {
      scrollWindowToPanel(safeIndex, instant, updateHash);
      return;
    }

    if (!stageShell) return;
    if (!force && (state.animating || performance.now() < state.lockUntil)) return;

    const targetTop = getPanelTop(safeIndex);
    const currentTop = stageShell.scrollTop;

    if (Math.abs(currentTop - targetTop) <= 2) {
      stageShell.scrollTop = targetTop;
      state.lockUntil = performance.now() + 120;
      updateActiveUi(safeIndex, { updateHash });
      return;
    }

    stopStageAnimation();
    updateActiveUi(safeIndex, { updateHash });

    if (instant) {
      stageShell.scrollTop = targetTop;
      state.lockUntil = performance.now() + 120;
      return;
    }

    const from = currentTop;
    const delta = targetTop - from;
    const start = performance.now();

    state.animating = true;
    state.lockUntil = start + STAGE_DURATION + POST_LOCK_MS;

    const step = (now) => {
      const progress = Math.min(1, (now - start) / STAGE_DURATION);
      const eased = easeInOutCubic(progress);
      stageShell.scrollTop = Math.round(from + delta * eased);

      if (progress < 1) {
        state.frameId = window.requestAnimationFrame(step);
        return;
      }

      stageShell.scrollTop = targetTop;
      state.frameId = 0;
      state.animating = false;
      state.lockUntil = performance.now() + POST_LOCK_MS;
      updateActiveUi(safeIndex, { updateHash });
    };

    state.frameId = window.requestAnimationFrame(step);
  }

  function handleStageWheel(event) {
    if (!state.stageMode || body.classList.contains('nav-open')) return;
    if (event.ctrlKey || event.metaKey) return;
    if (isTypingContext(event.target)) return;

    const primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(primaryDelta) < 1) return;

    event.preventDefault();

    if (state.animating || performance.now() < state.lockUntil) return;

    const now = performance.now();
    if (now - state.lastWheelTs > WHEEL_RESET_MS) state.wheelAccum = 0;
    state.lastWheelTs = now;
    state.wheelAccum += primaryDelta;

    const threshold = Math.max(WHEEL_THRESHOLD, Math.min(78, window.innerHeight * 0.04));
    if (Math.abs(state.wheelAccum) < threshold) return;

    const direction = state.wheelAccum > 0 ? 1 : -1;
    state.wheelAccum = 0;
    goToPanel(state.activeIndex + direction);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') closeNav();
    if (!state.stageMode || isTypingContext(event.target) || !panels.length) return;

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

  function handleTouchStart(event) {
    if (!state.stageMode || event.touches.length !== 1) return;
    if (isTypingContext(event.target)) return;
    state.touchArmed = true;
    state.touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    if (!state.stageMode || !state.touchArmed) return;
    const delta = Math.abs(event.touches[0].clientY - state.touchStartY);
    if (delta > 10) event.preventDefault();
  }

  function handleTouchEnd(event) {
    if (!state.stageMode || !state.touchArmed) {
      state.touchArmed = false;
      return;
    }

    const changedTouch = event.changedTouches && event.changedTouches[0];
    state.touchArmed = false;

    if (!changedTouch || state.animating || performance.now() < state.lockUntil) return;

    const delta = state.touchStartY - changedTouch.clientY;
    if (Math.abs(delta) < TOUCH_THRESHOLD) return;

    goToPanel(state.activeIndex + (delta > 0 ? 1 : -1));
  }

  function settleStagePosition() {
    if (!state.stageMode || !stageShell || state.animating) return;
    const nearestIndex = getNearestPanelIndex(stageShell.scrollTop);
    goToPanel(nearestIndex, { force: true, updateHash: false });
  }

  function handleStageScroll() {
    if (!state.stageMode || !stageShell) return;
    if (state.scrollTicking) return;

    state.scrollTicking = true;
    window.requestAnimationFrame(() => {
      const nearestIndex = getNearestPanelIndex(stageShell.scrollTop);
      if (nearestIndex !== state.activeIndex) updateActiveUi(nearestIndex, { updateHash: false });
      setHeaderState();
      state.scrollTicking = false;
    });

    if (state.animating) return;
    window.clearTimeout(state.settleTimer);
    state.settleTimer = window.setTimeout(settleStagePosition, SETTLE_DELAY_MS);
  }

  function updateIndexFromWindowScroll() {
    if (state.stageMode || !panels.length) return;
    const probe = window.scrollY + getHeaderOffset() + window.innerHeight * 0.28;
    let activeIndex = 0;

    panels.forEach((panel, index) => {
      if (panel.offsetTop <= probe) activeIndex = index;
    });

    updateActiveUi(activeIndex, { updateHash: false });
  }

  function handleWindowScroll() {
    if (state.stageMode) return;
    if (state.scrollTicking) return;

    state.scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateIndexFromWindowScroll();
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
      if (nextStageMode && stageShell) {
        stageShell.scrollTop = getPanelTop(state.activeIndex);
      }
      setHeaderState();
      return;
    }

    stopStageAnimation();
    state.stageMode = nextStageMode;
    state.lockUntil = 0;
    state.wheelAccum = 0;
    html.classList.toggle('is-stage-mode', nextStageMode);
    body.classList.toggle('is-stage-mode', nextStageMode);

    if (nextStageMode) {
      const hashIndex = getPanelIndexFromHash(window.location.hash);
      if (hashIndex >= 0) {
        state.activeIndex = hashIndex;
      } else if (!window.location.hash) {
        state.activeIndex = getNearestPanelIndex(window.scrollY + getHeaderOffset());
      }

      window.scrollTo(0, 0);
      if (stageShell) stageShell.scrollTop = getPanelTop(state.activeIndex);
      updateActiveUi(state.activeIndex, { updateHash: false });
      return;
    }

    if (stageShell) stageShell.scrollTop = getPanelTop(state.activeIndex);

    const target = panels[state.activeIndex];
    const top = target
      ? Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 2))
      : 0;

    window.scrollTo(0, top);
    updateIndexFromWindowScroll();
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

  attachAnchorHandling();

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', syncMode);
  window.addEventListener('orientationchange', syncMode);
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  window.addEventListener('wheel', handleStageWheel, { passive: false });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });

  if (stageShell) {
    stageShell.addEventListener('scroll', handleStageScroll, { passive: true });
  }

  window.addEventListener('hashchange', () => {
    const hashIndex = getPanelIndexFromHash(window.location.hash);
    if (hashIndex < 0) return;

    if (state.stageMode) {
      goToPanel(hashIndex, { force: true, instant: true, updateHash: false });
    } else {
      updateIndexFromWindowScroll();
    }
  });

  document.querySelectorAll('[data-track]').forEach((element) => {
    element.addEventListener('click', () => {
      const name = element.getAttribute('data-track');
      if (name) track(name);
    });
  });

  syncMode();
  updateIndexFromWindowScroll();
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
