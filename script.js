
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

  const CONFIG = {
    minWidth: 1024,
    minHeight: 700,
    wheelThreshold: 40,
    wheelResetMs: 140,
    quietRearmMs: 280,
    transitionMs: 1260,
    instantTransitionMs: 0,
    postLockMs: 420,
    touchThreshold: 54
  };

  const state = {
    stageMode: false,
    activeIndex: 0,
    animating: false,
    lockUntil: 0,
    wheelReady: true,
    wheelAccum: 0,
    lastWheelTs: 0,
    rearmTimer: 0,
    transitionTimer: 0,
    scrollTicking: false,
    touchStartY: 0,
    touchArmed: false
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function canUseStageMode() {
    return Boolean(stageShell && stageTrack && panels.length > 1)
      && window.innerWidth >= CONFIG.minWidth
      && window.innerHeight >= CONFIG.minHeight;
  }

  function stageDuration() {
    return prefersReducedMotion() ? CONFIG.instantTransitionMs : CONFIG.transitionMs;
  }

  function postLockDuration() {
    return prefersReducedMotion() ? 100 : CONFIG.postLockMs;
  }

  function getHeaderOffset() {
    return header ? header.offsetHeight : 0;
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

  function setHeaderState() {
    if (!header) return;
    const scrolled = state.stageMode ? state.activeIndex > 0 : (window.scrollY || window.pageYOffset || 0) > 8;
    header.classList.toggle('is-scrolled', scrolled);
  }

  function setTrackTransition(ms) {
    if (!stageTrack) return;
    stageTrack.style.transitionDuration = `${Math.max(0, ms)}ms`;
    stageTrack.style.transitionTimingFunction = ms === 0 ? 'linear' : 'cubic-bezier(.16,.92,.2,1)';
  }

  function setTrackToIndex(index, instant = false) {
    if (!stageTrack) return;
    if (instant) setTrackTransition(0);
    stageTrack.style.transform = `translate3d(0, ${clamp(index, 0, panels.length - 1) * -100}%, 0)`;
    if (instant) {
      window.requestAnimationFrame(() => {
        setTrackTransition(stageDuration());
      });
    }
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

    body.dataset.panel = panels[safeIndex]?.id || 'hero';

    if (state.stageMode) {
      setTrackToIndex(safeIndex);
    }

    if (options.updateHash !== false && panels[safeIndex]?.id) {
      history.replaceState(null, '', `#${panels[safeIndex].id}`);
    }

    setHeaderState();
  }

  function clearTimers() {
    window.clearTimeout(state.transitionTimer);
    window.clearTimeout(state.rearmTimer);
    state.transitionTimer = 0;
    state.rearmTimer = 0;
  }

  function scheduleWheelRearm() {
    window.clearTimeout(state.rearmTimer);
    state.rearmTimer = window.setTimeout(() => {
      if (!state.stageMode) {
        state.wheelReady = true;
        state.wheelAccum = 0;
        return;
      }
      if (state.animating || performance.now() < state.lockUntil) {
        scheduleWheelRearm();
        return;
      }
      state.wheelReady = true;
      state.wheelAccum = 0;
    }, CONFIG.quietRearmMs);
  }

  function finishStageMove() {
    window.clearTimeout(state.transitionTimer);
    state.transitionTimer = 0;
    state.animating = false;
    scheduleWheelRearm();
  }

  function goToPanel(index, options = {}) {
    if (!panels.length) return;

    const safeIndex = clamp(index, 0, panels.length - 1);
    const instant = Boolean(options.instant) || prefersReducedMotion();
    const force = Boolean(options.force);

    if (state.stageMode) {
      if (!force && (state.animating || performance.now() < state.lockUntil || !state.wheelReady)) return;
      if (safeIndex === state.activeIndex && !force) return;

      const duration = instant ? 0 : stageDuration();
      clearTimers();
      state.animating = duration > 0;
      state.wheelReady = false;
      state.wheelAccum = 0;
      setTrackTransition(duration);
      state.lockUntil = performance.now() + duration + postLockDuration();
      updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });

      if (duration === 0) {
        finishStageMove();
        return;
      }

      state.transitionTimer = window.setTimeout(() => {
        finishStageMove();
      }, duration + 20);
      return;
    }

    const target = panels[safeIndex];
    if (!target) return;

    const top = Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 2));
    window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
    updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });
  }

  function isTypingContext(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, option, [contenteditable="true"]'));
  }

  function handleStageWheel(event) {
    if (!state.stageMode) return;
    if (body.classList.contains('nav-open')) return;
    if (event.ctrlKey || event.metaKey) return;
    if (isTypingContext(event.target)) return;

    const primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(primaryDelta) < 1) return;

    event.preventDefault();

    const now = performance.now();
    if (now - state.lastWheelTs > CONFIG.wheelResetMs) {
      state.wheelAccum = 0;
    }
    state.lastWheelTs = now;

    if (state.animating || now < state.lockUntil || !state.wheelReady) {
      scheduleWheelRearm();
      return;
    }

    state.wheelAccum += primaryDelta;
    scheduleWheelRearm();

    if (Math.abs(state.wheelAccum) < CONFIG.wheelThreshold) return;

    const direction = state.wheelAccum > 0 ? 1 : -1;
    state.wheelAccum = 0;
    goToPanel(state.activeIndex + direction);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeNav();
    }

    if (!state.stageMode || !panels.length || isTypingContext(event.target)) return;

    if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      goToPanel(state.activeIndex + 1, { force: true });
      return;
    }

    if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      goToPanel(state.activeIndex - 1, { force: true });
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
    if (state.animating || performance.now() < state.lockUntil || !state.wheelReady) return;

    const delta = state.touchStartY - changedTouch.clientY;
    if (Math.abs(delta) < CONFIG.touchThreshold) return;
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
      if (nextStageMode) {
        setTrackToIndex(state.activeIndex, true);
      }
      setHeaderState();
      return;
    }

    clearTimers();
    state.animating = false;
    state.wheelAccum = 0;
    state.wheelReady = true;
    state.lockUntil = 0;
    state.stageMode = nextStageMode;
    html.classList.toggle('is-stage-mode', nextStageMode);
    body.classList.toggle('is-stage-mode', nextStageMode);

    if (nextStageMode) {
      const hashIndex = getPanelIndexFromHash(window.location.hash);
      if (hashIndex >= 0) state.activeIndex = hashIndex;
      setTrackToIndex(state.activeIndex, true);
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
  window.addEventListener('wheel', handleStageWheel, { passive: false });
  window.addEventListener('touchstart', handleStageTouchStart, { passive: true });
  window.addEventListener('touchmove', handleStageTouchMove, { passive: false });
  window.addEventListener('touchend', handleStageTouchEnd, { passive: true });
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
