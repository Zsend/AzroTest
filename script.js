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

  const STAGE_DURATION = 1040;
  const POST_LOCK_MS = 260;
  const WHEEL_RESET_MS = 160;
  const TOUCH_THRESHOLD = 52;

  const state = {
    stageMode: false,
    activeIndex: 0,
    animating: false,
    lockUntil: 0,
    frameId: 0,
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
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function hasFinePointer() {
    return window.matchMedia('(pointer: fine)').matches;
  }

  function canUseStageMode() {
    return Boolean(stageShell && panels.length > 1)
      && window.innerWidth >= 1080
      && window.innerHeight >= 680
      && hasFinePointer()
      && !prefersReducedMotion();
  }

  function getHeaderOffset() {
    return header ? header.offsetHeight : 0;
  }

  function setViewportHeightVar() {
    const stageHeight = Math.max(0, window.innerHeight - getHeaderOffset());
    html.style.setProperty('--stage-h', `${stageHeight}px`);
    html.classList.toggle('is-short-height', window.innerHeight < 860);
    html.classList.toggle('is-tiny-height', window.innerHeight < 760);
    html.classList.toggle('is-micro-height', window.innerHeight < 700);
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
    if (!panel) return 0;
    return panel.offsetTop;
  }

  function setHeaderState() {
    if (!header) return;
    const scrolled = state.stageMode
      ? state.activeIndex > 0
      : (window.scrollY || window.pageYOffset || 0) > 8;
    header.classList.toggle('is-scrolled', scrolled);
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
      const active = activeId && link.getAttribute('href') === activeId;
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
    state.animating = false;
  }

  function easeInOutQuart(t) {
    return t < 0.5
      ? 8 * t * t * t * t
      : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  function scrollWindowToPanel(index, instant = false, updateHash = true) {
    const target = panels[index];
    if (!target) return;
    const top = Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 2));
    window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
    updateActiveUi(index, { updateHash });
  }

  function goToPanel(index, options = {}) {
    if (!panels.length) return;

    const safeIndex = clamp(index, 0, panels.length - 1);
    const instant = Boolean(options.instant) || prefersReducedMotion();
    const force = Boolean(options.force);

    if (!state.stageMode) {
      scrollWindowToPanel(safeIndex, instant, options.updateHash !== false);
      return;
    }

    if (!stageShell) return;
    if (!force && (state.animating || performance.now() < state.lockUntil)) return;

    const targetTop = getPanelTop(safeIndex);
    const currentTop = stageShell.scrollTop;

    if (Math.abs(currentTop - targetTop) <= 1) {
      stageShell.scrollTop = targetTop;
      updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });
      state.lockUntil = performance.now() + 80;
      return;
    }

    stopStageAnimation();
    updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });

    if (instant) {
      stageShell.scrollTop = targetTop;
      state.animating = false;
      state.lockUntil = performance.now() + 80;
      return;
    }

    const from = currentTop;
    const delta = targetTop - from;
    const start = performance.now();
    const duration = STAGE_DURATION;
    state.animating = true;
    state.lockUntil = start + duration + POST_LOCK_MS;

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = easeInOutQuart(progress);
      stageShell.scrollTop = from + delta * eased;

      if (progress < 1) {
        state.frameId = window.requestAnimationFrame(step);
        return;
      }

      stageShell.scrollTop = targetTop;
      state.frameId = 0;
      state.animating = false;
      state.lockUntil = performance.now() + POST_LOCK_MS;
      updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });
    };

    state.frameId = window.requestAnimationFrame(step);
  }

  function isTypingContext(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, option, [contenteditable="true"]'));
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

    const threshold = Math.max(26, Math.min(72, window.innerHeight * 0.03));
    if (Math.abs(state.wheelAccum) < threshold) return;

    const direction = state.wheelAccum > 0 ? 1 : -1;
    state.wheelAccum = 0;
    goToPanel(state.activeIndex + direction);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') closeNav();
    if (!state.stageMode || isTypingContext(event.target)) return;

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
    if (delta > 8) event.preventDefault();
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

  function updateIndexFromScroll() {
    if (state.stageMode || !panels.length) return;
    const probe = window.scrollY + getHeaderOffset() + window.innerHeight * 0.3;
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
    setViewportHeightVar();
    const nextStageMode = canUseStageMode();

    if (nextStageMode === state.stageMode) {
      if (nextStageMode && stageShell) {
        stageShell.scrollTop = getPanelTop(state.activeIndex);
      }
      setHeaderState();
      return;
    }

    state.stageMode = nextStageMode;
    html.classList.toggle('is-stage-mode', nextStageMode);
    body.classList.toggle('is-stage-mode', nextStageMode);
    stopStageAnimation();
    state.lockUntil = 0;
    state.wheelAccum = 0;

    if (nextStageMode) {
      const hashIndex = getPanelIndexFromHash(window.location.hash);
      if (hashIndex >= 0) state.activeIndex = hashIndex;
      window.scrollTo(0, 0);
      if (stageShell) stageShell.scrollTop = getPanelTop(state.activeIndex);
      updateActiveUi(state.activeIndex, { updateHash: false });
      return;
    }

    if (stageShell) stageShell.scrollTop = getPanelTop(state.activeIndex);
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

  attachAnchorHandling();

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', syncMode);
  window.addEventListener('orientationchange', syncMode);
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  window.addEventListener('wheel', handleStageWheel, { passive: false });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  window.addEventListener('hashchange', () => {
    const hashIndex = getPanelIndexFromHash(window.location.hash);
    if (hashIndex < 0) return;
    if (state.stageMode) {
      goToPanel(hashIndex, { force: true, instant: true, updateHash: false });
    } else {
      updateIndexFromScroll();
    }
  });

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
