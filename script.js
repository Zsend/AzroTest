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
    scrollEndTimer: 0,
    programmaticScroll: false,
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
    return Boolean(stageShell && stageTrack && panels.length > 1) && window.innerWidth >= 1024;
  }

  function getHeaderOffset() {
    return header ? header.offsetHeight : 0;
  }

  function getStageViewportHeight() {
    if (!stageShell) return 0;
    return stageShell.clientHeight || Math.max(0, window.innerHeight - getHeaderOffset());
  }

  function setViewportHeightVar() {
    html.style.setProperty('--stage-h', `${Math.max(0, window.innerHeight - getHeaderOffset())}px`);
    html.classList.toggle('is-short-height', window.innerHeight < 860);
    html.classList.toggle('is-tiny-height', window.innerHeight < 760);
    html.classList.toggle('is-micro-height', window.innerHeight < 700);
  }

  function isTypingContext(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, option, [contenteditable="true"]'));
  }

  function isUiContext(target) {
    return target instanceof Element && Boolean(target.closest('button, a, summary, details, .nav-toggle'));
  }

  function getPanelIndexFromHash(hash) {
    if (!hash || hash === '#top' || hash === '#') return 0;
    const id = hash.replace('#', '');
    return panels.findIndex((panel) => panel.id === id);
  }

  function getPanelTop(index) {
    const panel = panels[index];
    if (!panel || !stageShell) return 0;
    return panel.offsetTop;
  }

  function getNearestPanelIndex() {
    if (!stageShell || !panels.length) return 0;
    const scrollTop = stageShell.scrollTop;
    let bestIndex = 0;
    let bestDistance = Infinity;

    panels.forEach((panel, index) => {
      const distance = Math.abs(panel.offsetTop - scrollTop);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  function setHeaderState() {
    if (!header) return;
    const scrolled = state.stageMode ? stageShell && stageShell.scrollTop > 6 : (window.scrollY || window.pageYOffset || 0) > 8;
    header.classList.toggle('is-scrolled', Boolean(scrolled));
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

    if (options.updateHash !== false && panels[safeIndex]?.id) {
      history.replaceState(null, '', `#${panels[safeIndex].id}`);
    }

    setHeaderState();
  }

  function finishStageAnimation(finalIndex) {
    window.clearTimeout(state.scrollEndTimer);
    state.programmaticScroll = false;
    state.animating = false;
    if (typeof finalIndex === 'number') {
      updateActiveUi(finalIndex, { updateHash: false });
    }
  }

  function snapToNearestPanel(behavior = 'smooth') {
    if (!state.stageMode || !stageShell) return;
    const targetIndex = getNearestPanelIndex();
    const targetTop = getPanelTop(targetIndex);

    if (Math.abs(stageShell.scrollTop - targetTop) <= 2) {
      updateActiveUi(targetIndex, { updateHash: false });
      finishStageAnimation(targetIndex);
      return;
    }

    state.programmaticScroll = true;
    stageShell.scrollTo({ top: targetTop, behavior: prefersReducedMotion() ? 'auto' : behavior });
    updateActiveUi(targetIndex);

    window.clearTimeout(state.scrollEndTimer);
    state.scrollEndTimer = window.setTimeout(() => {
      stageShell.scrollTop = targetTop;
      finishStageAnimation(targetIndex);
    }, prefersReducedMotion() ? 40 : 460);
  }

  function goToPanel(index, options = {}) {
    if (!panels.length) return;

    const safeIndex = clamp(index, 0, panels.length - 1);
    const instant = Boolean(options.instant) || prefersReducedMotion();

    if (state.stageMode) {
      if (!options.force && (state.animating || performance.now() < state.lockUntil)) return;
      const targetTop = getPanelTop(safeIndex);
      const currentTop = stageShell ? stageShell.scrollTop : 0;

      if (!options.force && Math.abs(currentTop - targetTop) < 2) {
        updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });
        return;
      }

      state.animating = !instant;
      state.programmaticScroll = true;
      state.lockUntil = performance.now() + (instant ? 100 : 760);

      if (stageShell) {
        stageShell.scrollTo({ top: targetTop, behavior: instant ? 'auto' : 'smooth' });
      }

      updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });

      window.clearTimeout(state.scrollEndTimer);
      state.scrollEndTimer = window.setTimeout(() => {
        if (stageShell) stageShell.scrollTop = targetTop;
        finishStageAnimation(safeIndex);
      }, instant ? 40 : 820);
      return;
    }

    const target = panels[safeIndex];
    if (!target) return;

    const top = Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 2));
    window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
    updateActiveUi(safeIndex, { updateHash: options.updateHash !== false });
  }

  function handleStageWheel(event) {
    if (!state.stageMode || body.classList.contains('nav-open')) return;
    if (event.ctrlKey || event.metaKey) return;
    if (isTypingContext(event.target)) return;

    const primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(primaryDelta) < 4) return;

    event.preventDefault();

    if (state.animating || performance.now() < state.lockUntil) return;

    goToPanel(state.activeIndex + (primaryDelta > 0 ? 1 : -1));
  }

  function handleStageKeydown(event) {
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

  function handleStageTouchStart(event) {
    if (!state.stageMode || event.touches.length !== 1) return;
    if (isTypingContext(event.target) || isUiContext(event.target)) return;
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
    if (!changedTouch || state.animating || performance.now() < state.lockUntil) return;

    const delta = state.touchStartY - changedTouch.clientY;
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
    updateIndexFromScroll();
    setHeaderState();
  }

  function handleStageScroll() {
    if (!state.stageMode || !stageShell) return;

    window.clearTimeout(state.scrollEndTimer);

    const nearestIndex = getNearestPanelIndex();
    if (nearestIndex !== state.activeIndex) {
      updateActiveUi(nearestIndex, { updateHash: false });
    }

    state.scrollEndTimer = window.setTimeout(() => {
      if (!stageShell) return;
      const snapIndex = getNearestPanelIndex();
      const targetTop = getPanelTop(snapIndex);
      const shouldCorrect = Math.abs(stageShell.scrollTop - targetTop) > 2;

      if (shouldCorrect) {
        state.animating = true;
        state.programmaticScroll = true;
        state.lockUntil = performance.now() + (prefersReducedMotion() ? 60 : 420);
        stageShell.scrollTo({ top: targetTop, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        updateActiveUi(snapIndex);
        window.clearTimeout(state.scrollEndTimer);
        state.scrollEndTimer = window.setTimeout(() => {
          if (stageShell) stageShell.scrollTop = targetTop;
          finishStageAnimation(snapIndex);
        }, prefersReducedMotion() ? 40 : 440);
        return;
      }

      finishStageAnimation(snapIndex);
    }, state.programmaticScroll ? 90 : 120);
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
    setViewportHeightVar();
    window.clearTimeout(state.scrollEndTimer);
    state.lockUntil = 0;
    state.animating = false;
    state.programmaticScroll = false;

    if (nextStageMode) {
      const hashIndex = getPanelIndexFromHash(window.location.hash);
      if (hashIndex >= 0) state.activeIndex = hashIndex;
      if (stageShell) {
        stageShell.scrollTop = getPanelTop(state.activeIndex);
      }
      window.scrollTo(0, 0);
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

  document.addEventListener('keydown', handleStageKeydown);
  window.addEventListener('resize', syncMode);
  window.addEventListener('orientationchange', syncMode);
  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  window.addEventListener('wheel', handleStageWheel, { passive: false });
  window.addEventListener('touchstart', handleStageTouchStart, { passive: true });
  window.addEventListener('touchmove', handleStageTouchMove, { passive: false });
  window.addEventListener('touchend', handleStageTouchEnd, { passive: true });

  if (stageShell) {
    stageShell.addEventListener('scroll', handleStageScroll, { passive: true });
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
