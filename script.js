(function () {
  const docEl = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const storyScroll = document.getElementById('story-scroll');
  const storyTrack = document.getElementById('story-track');
  const stages = Array.from(document.querySelectorAll('.snap-stage'));
  const chapterRail = document.getElementById('chapter-rail');
  const year = document.getElementById('year');
  const form = document.getElementById('application-form');

  const state = {
    chapterMode: false,
    activeIndex: 0,
    animating: false,
    animTimer: 0,
    lockUntil: 0,
    wheelAccum: 0,
    lastWheelTs: 0,
    chapterHeight: 0,
    touchStartY: null
  };

  if (year) year.textContent = String(new Date().getFullYear());

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getHeaderOffset() {
    return header ? header.offsetHeight : 0;
  }

  function buildChapterRail() {
    if (!chapterRail || !stages.length) return;
    chapterRail.innerHTML = '';

    stages.forEach((stage, index) => {
      const label = stage.getAttribute('data-snap-label') || `Section ${index + 1}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chapter-link';
      button.setAttribute('data-stage-target', String(index));
      button.setAttribute('aria-label', `Go to ${label}`);
      button.innerHTML = `<span class="chapter-link__dot" aria-hidden="true"></span><span class="chapter-link__label">${label}</span>`;
      button.addEventListener('click', () => {
        goToStage(index);
      });
      chapterRail.appendChild(button);
    });
  }

  function chapterButtons() {
    return chapterRail ? Array.from(chapterRail.querySelectorAll('[data-stage-target]')) : [];
  }

  function updateHeaderState() {
    if (!header) return;
    const scrolled = state.chapterMode ? state.activeIndex > 0 : (window.scrollY || docEl.scrollTop || 0) > 8;
    header.classList.toggle('is-scrolled', scrolled);
  }

  function useChapterMode() {
    return Boolean(storyScroll && storyTrack && stages.length > 1) && window.innerWidth >= 1120 && window.innerHeight >= 720 && !prefersReducedMotion();
  }

  function setStageHeights() {
    if (!storyScroll || !storyTrack) return;

    if (!state.chapterMode) {
      docEl.style.removeProperty('--chapter-h');
      storyTrack.style.height = '';
      storyTrack.style.transform = '';
      storyTrack.classList.remove('is-animating');
      stages.forEach((stage) => {
        stage.style.height = '';
        stage.style.minHeight = '';
        stage.style.maxHeight = '';
      });
      return;
    }

    state.chapterHeight = storyScroll.clientHeight;
    docEl.style.setProperty('--chapter-h', `${state.chapterHeight}px`);
    storyTrack.style.height = `${state.chapterHeight * stages.length}px`;

    stages.forEach((stage) => {
      stage.style.height = `${state.chapterHeight}px`;
      stage.style.minHeight = `${state.chapterHeight}px`;
      stage.style.maxHeight = `${state.chapterHeight}px`;
    });

    storyTrack.style.transform = `translate3d(0, ${-state.activeIndex * state.chapterHeight}px, 0)`;
  }

  function setNavActive() {
    if (!navLinks.length) return;
    const activeStage = stages[state.activeIndex];

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href === '#top') {
        link.classList.remove('is-active');
        return;
      }
      const target = document.querySelector(href);
      const active = activeStage === target;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function setActiveStage(index) {
    state.activeIndex = clamp(index, 0, Math.max(0, stages.length - 1));

    stages.forEach((stage, stageIndex) => {
      stage.classList.toggle('is-active-stage', stageIndex === state.activeIndex);
    });

    chapterButtons().forEach((button, buttonIndex) => {
      const active = buttonIndex === state.activeIndex;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'true' : 'false');
    });

    setNavActive();
    updateHeaderState();
  }

  function stopAnimating() {
    state.animating = false;
    storyTrack?.classList.remove('is-animating');
  }

  function goToStage(index, options = {}) {
    if (!stages.length) return;

    const targetIndex = clamp(index, 0, stages.length - 1);
    const immediate = Boolean(options.immediate) || prefersReducedMotion();
    const transitionMs = immediate ? 0 : 860;

    setActiveStage(targetIndex);

    if (state.chapterMode && storyTrack) {
      state.animating = !immediate;
      window.clearTimeout(state.animTimer);
      if (!immediate) storyTrack.classList.add('is-animating');
      state.lockUntil = performance.now() + (immediate ? 80 : transitionMs + 120);
      storyTrack.style.transitionDuration = `${transitionMs}ms`;
      storyTrack.style.transform = `translate3d(0, ${-targetIndex * state.chapterHeight}px, 0)`;

      if (immediate) {
        stopAnimating();
      } else {
        state.animTimer = window.setTimeout(stopAnimating, transitionMs + 30);
      }
      return;
    }

    const targetStage = stages[targetIndex];
    if (!targetStage) return;
    const top = Math.max(0, Math.round(targetStage.getBoundingClientRect().top + window.scrollY - getHeaderOffset()));
    window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
  }

  function shouldIgnoreSnapTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, option, summary, [contenteditable="true"], .nav-toggle'));
  }

  function handleWheel(event) {
    if (!state.chapterMode || !storyTrack) return;
    if (body.classList.contains('nav-open')) return;
    if (event.ctrlKey || shouldIgnoreSnapTarget(event.target)) return;

    event.preventDefault();

    const now = performance.now();
    if (state.animating || now < state.lockUntil) return;

    const delta = event.deltaY;
    if (Math.abs(delta) < 1) return;

    if (now - state.lastWheelTs > 180) state.wheelAccum = 0;
    state.lastWheelTs = now;
    state.wheelAccum += delta;

    const threshold = Math.max(18, window.innerHeight * 0.018);
    if (Math.abs(state.wheelAccum) < threshold) return;

    const direction = state.wheelAccum > 0 ? 1 : -1;
    state.wheelAccum = 0;
    goToStage(state.activeIndex + direction);
  }

  function isTypingContext(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  }

  function handleKeydown(event) {
    if (body.classList.contains('nav-open')) {
      if (event.key === 'Escape') closeNav();
      return;
    }

    if (state.chapterMode && !isTypingContext(event.target)) {
      if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        goToStage(state.activeIndex + 1);
        return;
      }

      if (['ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        goToStage(state.activeIndex - 1);
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        goToStage(0);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        goToStage(stages.length - 1);
      }
    }
  }

  function getNearestStageIndex() {
    if (!stages.length) return 0;
    const probe = window.scrollY + window.innerHeight * 0.38;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    stages.forEach((stage, index) => {
      const center = stage.offsetTop + stage.offsetHeight / 2;
      const distance = Math.abs(center - probe);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  function handleWindowScroll() {
    if (state.chapterMode) return;
    setActiveStage(getNearestStageIndex());
  }

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

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!target || !(target instanceof Element)) return;
      if (!header?.classList.contains('nav-open')) return;
      if (header.contains(target)) return;
      closeNav();
    });
  }

  function findStageIndexForTarget(target) {
    if (!target) return -1;
    const stage = target.classList?.contains('snap-stage') ? target : target.closest('.snap-stage');
    return stage ? stages.indexOf(stage) : -1;
  }

  function attachAnchorHandling() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        if (href === '#top') {
          closeNav();
          if (state.chapterMode) {
            event.preventDefault();
            goToStage(0);
          }
          return;
        }

        const target = document.querySelector(href);
        if (!target) return;
        const targetIndex = findStageIndexForTarget(target);
        closeNav();

        if (targetIndex >= 0) {
          event.preventDefault();
          goToStage(targetIndex);
        }
      });
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

  function syncMode() {
    const nextMode = useChapterMode();

    if (state.chapterMode !== nextMode) {
      state.chapterMode = nextMode;
      docEl.classList.toggle('is-chapter-mode', nextMode);
      body.classList.toggle('is-chapter-mode', nextMode);
    }

    if (state.chapterMode) {
      setStageHeights();
      goToStage(state.activeIndex, { immediate: true });
    } else {
      setStageHeights();
      const activeStage = stages[state.activeIndex];
      if (activeStage) {
        const top = Math.max(0, Math.round(activeStage.getBoundingClientRect().top + window.scrollY - getHeaderOffset()));
        window.scrollTo(0, top);
      }
      setActiveStage(getNearestStageIndex());
    }
  }

  function handleTouchStart(event) {
    if (!state.chapterMode || shouldIgnoreSnapTarget(event.target)) return;
    if (event.touches.length !== 1) return;
    state.touchStartY = event.touches[0].clientY;
  }

  function handleTouchEnd(event) {
    if (!state.chapterMode || state.touchStartY === null) return;
    const endY = event.changedTouches[0].clientY;
    const delta = state.touchStartY - endY;
    state.touchStartY = null;
    if (Math.abs(delta) < 48) return;
    if (state.animating || performance.now() < state.lockUntil) return;
    goToStage(state.activeIndex + (delta > 0 ? 1 : -1));
  }


  document.querySelectorAll('.faq-item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      document.querySelectorAll('.faq-item').forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  buildChapterRail();
  attachAnchorHandling();
  setActiveStage(0);

  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  window.addEventListener('resize', syncMode);
  window.addEventListener('orientationchange', syncMode);

  syncMode();

  window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (!hash) return;
    const target = document.querySelector(hash);
    const index = findStageIndexForTarget(target);
    if (index >= 0) {
      goToStage(index, { immediate: true });
    }
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    const target = hash ? document.querySelector(hash) : null;
    const index = findStageIndexForTarget(target);
    if (index >= 0) goToStage(index);
  });

  if (!form) return;

  const status = form.querySelector('.form-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const name = (data.get('name') || '').toString().trim();
    const business = (data.get('business') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();

    if (!name || !business || !email) {
      if (status) status.textContent = 'Please add your name, business, and email before creating the application email.';
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
      'What the business is trying to solve:',
      (data.get('challenge') || '').toString().trim() || '—',
      '',
      'Submitted from your-domain.com static Reserve Review form.'
    ];

    const subject = encodeURIComponent(`Reserve Review — ${business}`);
    const bodyText = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:${emailTarget}?subject=${subject}&body=${bodyText}`;
    if (status) status.textContent = `Your email app should open with a pre-filled application. If nothing happens, email ${emailTarget} directly.`;
    track('submit_application');
  });
})();
