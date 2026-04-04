(function () {
  const docEl = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const main = document.getElementById('main');
  const storyScroll = document.getElementById('story-scroll');
  const snapStages = Array.from(document.querySelectorAll('.snap-stage'));

  const state = {
    chapterMode: false,
    animating: false,
    activeStageIndex: 0,
    settleTimer: 0,
    wheelLockUntil: 0
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function useChapterMode() {
    return Boolean(storyScroll) && snapStages.length > 1 && window.innerWidth >= 1120 && window.innerHeight >= 820 && !prefersReducedMotion();
  }

  function getHeaderOffset() {
    return header ? header.offsetHeight : 0;
  }

  function getViewportHeight() {
    if (state.chapterMode && storyScroll) return storyScroll.clientHeight;
    return window.innerHeight;
  }

  function getScrollTop() {
    if (state.chapterMode && storyScroll) return storyScroll.scrollTop;
    return window.scrollY || docEl.scrollTop || 0;
  }

  function getStageTop(index) {
    const stage = snapStages[clamp(index, 0, Math.max(0, snapStages.length - 1))];
    if (!stage) return 0;

    if (state.chapterMode && storyScroll) {
      return stage.offsetTop;
    }

    return Math.max(0, Math.round(stage.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 2));
  }

  function getStageCenter(stage) {
    if (state.chapterMode && storyScroll) {
      return stage.offsetTop + stage.offsetHeight / 2;
    }

    return stage.offsetTop + stage.offsetHeight / 2;
  }

  function getNearestStageIndex() {
    if (!snapStages.length) return 0;

    const probe = getScrollTop() + getViewportHeight() * 0.45 + (state.chapterMode ? 0 : getHeaderOffset() * 0.2);
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    snapStages.forEach((stage, index) => {
      const center = getStageCenter(stage);
      const distance = Math.abs(center - probe);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  function setNavActiveByScroll() {
    if (!navLinks.length) return;

    const candidates = navLinks
      .map((link) => {
        const href = link.getAttribute('href');
        if (!href || href === '#top' || href === '#') return null;
        const section = document.querySelector(href);
        if (!section) return null;
        const top = state.chapterMode ? section.offsetTop : getStageTopFromElement(section);
        return { link, top };
      })
      .filter(Boolean)
      .sort((a, b) => a.top - b.top);

    if (!candidates.length) return;

    const probe = getScrollTop() + getViewportHeight() * 0.22;
    let active = candidates[0].link;

    candidates.forEach((candidate) => {
      if (candidate.top <= probe) active = candidate.link;
    });

    navLinks.forEach((link) => link.classList.toggle('is-active', link === active));
  }

  function getStageTopFromElement(element) {
    if (state.chapterMode && storyScroll) {
      return element.offsetTop;
    }
    return Math.max(0, Math.round(element.getBoundingClientRect().top + window.scrollY - getHeaderOffset() - 2));
  }

  function setActiveStage(index) {
    state.activeStageIndex = clamp(index, 0, Math.max(0, snapStages.length - 1));
    snapStages.forEach((stage, stageIndex) => {
      stage.classList.toggle('is-active-stage', stageIndex === state.activeStageIndex);
    });
    setNavActiveByScroll();
  }

  function finishStageScroll(targetIndex) {
    state.animating = false;
    setActiveStage(targetIndex);
  }

  function scrollToStage(index, options = {}) {
    if (!snapStages.length) return;

    const targetIndex = clamp(index, 0, snapStages.length - 1);
    const targetTop = getStageTop(targetIndex);
    const immediate = Boolean(options.immediate) || prefersReducedMotion();
    const behavior = immediate ? 'auto' : 'smooth';
    const scroller = state.chapterMode && storyScroll ? storyScroll : window;
    const startTime = performance.now();
    const timeoutMs = immediate ? 50 : 900;

    window.clearTimeout(state.settleTimer);
    state.animating = true;
    state.wheelLockUntil = performance.now() + (immediate ? 80 : 760);
    setActiveStage(targetIndex);

    if (state.chapterMode && storyScroll) {
      storyScroll.scrollTo({ top: targetTop, behavior });
    } else {
      window.scrollTo({ top: targetTop, behavior });
    }

    function settle() {
      const currentTop = state.chapterMode && storyScroll ? storyScroll.scrollTop : window.scrollY;
      const done = Math.abs(currentTop - targetTop) <= 2 || performance.now() - startTime >= timeoutMs;
      if (done) {
        if (state.chapterMode && storyScroll) {
          storyScroll.scrollTo({ top: targetTop, behavior: 'auto' });
        } else {
          window.scrollTo(0, targetTop);
        }
        finishStageScroll(targetIndex);
        return;
      }
      window.requestAnimationFrame(settle);
    }

    window.requestAnimationFrame(settle);
  }

  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle('is-scrolled', getScrollTop() > 8);
  }

  function maybeAutoSettle() {
    if (!state.chapterMode || state.animating || !storyScroll) return;

    window.clearTimeout(state.settleTimer);
    state.settleTimer = window.setTimeout(() => {
      if (!state.chapterMode || state.animating || !storyScroll) return;
      const nearestIndex = getNearestStageIndex();
      const targetTop = getStageTop(nearestIndex);
      if (Math.abs(storyScroll.scrollTop - targetTop) > 6) {
        scrollToStage(nearestIndex);
      } else {
        setActiveStage(nearestIndex);
      }
    }, 120);
  }

  function handleWindowScroll() {
    if (state.chapterMode) return;
    updateHeaderState();
    if (snapStages.length) setActiveStage(getNearestStageIndex());
  }

  function handleStoryScroll() {
    if (!state.chapterMode) return;
    updateHeaderState();
    if (snapStages.length) setActiveStage(getNearestStageIndex());
    maybeAutoSettle();
  }

  function shouldIgnoreSnapTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, option, [contenteditable="true"], .nav-toggle'));
  }

  function handleWheel(event) {
    if (!state.chapterMode || !storyScroll || snapStages.length < 2) return;
    if (body.classList.contains('nav-open')) return;
    if (event.ctrlKey || shouldIgnoreSnapTarget(event.target)) return;

    const delta = event.deltaY;
    if (Math.abs(delta) < 4) return;

    event.preventDefault();

    const now = performance.now();
    if (state.animating || now < state.wheelLockUntil) return;

    const direction = delta > 0 ? 1 : -1;
    const currentIndex = getNearestStageIndex();
    const nextIndex = clamp(currentIndex + direction, 0, snapStages.length - 1);

    if (nextIndex === currentIndex) {
      state.wheelLockUntil = now + 200;
      return;
    }

    scrollToStage(nextIndex);
  }

  function isTypingContext(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  }

  function handleKeydown(event) {
    if (!state.chapterMode || snapStages.length < 2 || isTypingContext(event.target)) return;

    const currentIndex = getNearestStageIndex();

    if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      scrollToStage(currentIndex + 1);
      return;
    }

    if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      scrollToStage(currentIndex - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      scrollToStage(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      scrollToStage(snapStages.length - 1);
    }
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

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
  }

  function attachAnchorHandling() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href === '#top') return;
        const target = document.querySelector(href);
        if (!target) return;

        closeNav();

        if (state.chapterMode && target.classList.contains('snap-stage')) {
          event.preventDefault();
          const targetIndex = snapStages.indexOf(target);
          if (targetIndex >= 0) scrollToStage(targetIndex);
          return;
        }

        if (!state.chapterMode && target.classList.contains('snap-stage')) {
          event.preventDefault();
          const top = getStageTopFromElement(target);
          window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
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
    const currentIndex = snapStages.length ? getNearestStageIndex() : 0;
    const nextMode = useChapterMode();
    state.chapterMode = nextMode;

    docEl.classList.toggle('is-chapter-mode', nextMode);
    body.classList.toggle('is-chapter-mode', nextMode);

    if (nextMode && storyScroll) {
      window.requestAnimationFrame(() => {
        storyScroll.scrollTop = getStageTop(currentIndex);
        setActiveStage(currentIndex);
        updateHeaderState();
      });
    } else {
      window.requestAnimationFrame(() => {
        const targetTop = getStageTop(currentIndex);
        window.scrollTo(0, targetTop);
        setActiveStage(currentIndex);
        updateHeaderState();
      });
    }
  }

  attachAnchorHandling();

  window.addEventListener('scroll', handleWindowScroll, { passive: true });
  if (storyScroll) {
    storyScroll.addEventListener('scroll', handleStoryScroll, { passive: true });
    storyScroll.addEventListener('wheel', handleWheel, { passive: false });
  }
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', syncMode);
  window.addEventListener('orientationchange', syncMode);

  syncMode();
  updateHeaderState();
  if (snapStages.length) setActiveStage(getNearestStageIndex());

  window.addEventListener('load', () => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (!target) return;

    if (state.chapterMode && target.classList.contains('snap-stage')) {
      const targetIndex = snapStages.indexOf(target);
      if (targetIndex >= 0) scrollToStage(targetIndex, { immediate: true });
      return;
    }

    if (!state.chapterMode && target.classList.contains('snap-stage')) {
      window.scrollTo(0, getStageTopFromElement(target));
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const form = document.getElementById('application-form');
  if (!form) return;

  const status = form.querySelector('.form-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const name = (data.get('name') || '').toString().trim();
    const business = (data.get('business') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();

    if (!name || !business || !email) {
      status.textContent = 'Please add your name, business, and email before creating the application email.';
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
    const body = encodeURIComponent(lines.join('\n'));
    const href = `mailto:${emailTarget}?subject=${subject}&body=${body}`;

    window.location.href = href;
    status.textContent = `Your email app should open with a pre-filled application. If nothing happens, email ${emailTarget} directly.`;
    track('submit_application');
  });
})();
