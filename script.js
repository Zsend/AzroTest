(function () {
  const docEl = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const snapStages = Array.from(document.querySelectorAll('.snap-stage'));

  let snapEnabled = false;
  let snapAnimating = false;
  let wheelCooldownUntil = 0;
  let activeStageIndex = 0;
  let scrollTicking = false;

  function getHeaderOffset() {
    return header ? header.offsetHeight : 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeNav();
      });
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

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);

    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      if (snapStages.length) {
        setActiveStage(getNearestStageIndex());
      }
      scrollTicking = false;
    });
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const sectionMap = navLinks
    .map((link) => {
      const id = link.getAttribute('href');
      if (!id || id === '#top') return null;
      return { link, section: document.querySelector(id) };
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sectionMap.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const match = sectionMap.find((item) => item.section === entry.target);
          if (!match) return;
          if (entry.isIntersecting) {
            navLinks.forEach((link) => link.classList.remove('is-active'));
            match.link.classList.add('is-active');
          }
        });
      },
      {
        rootMargin: '-32% 0px -48% 0px',
        threshold: [0, 0.2, 0.55, 1]
      }
    );

    sectionMap.forEach((item) => {
      if (item.section) observer.observe(item.section);
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

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function useSnapMode() {
    return window.innerWidth >= 1120 && window.innerHeight >= 820 && !prefersReducedMotion();
  }

  function setActiveStage(index) {
    activeStageIndex = clamp(index, 0, Math.max(0, snapStages.length - 1));
    snapStages.forEach((stage, stageIndex) => {
      stage.classList.toggle('is-active-stage', stageIndex === activeStageIndex);
    });
  }

  function getNearestStageIndex() {
    if (!snapStages.length) return 0;
    const headerOffset = getHeaderOffset();
    const viewportProbe = window.scrollY + headerOffset + Math.max(160, (window.innerHeight - headerOffset) * 0.42);

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    snapStages.forEach((stage, index) => {
      const top = stage.offsetTop;
      const height = stage.offsetHeight || window.innerHeight;
      const center = top + height / 2;
      const distance = Math.abs(center - viewportProbe);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  function getStageTop(index) {
    const headerOffset = getHeaderOffset();
    const stage = snapStages[clamp(index, 0, snapStages.length - 1)];
    if (!stage) return 0;
    return Math.max(0, Math.round(stage.getBoundingClientRect().top + window.scrollY - headerOffset - 2));
  }

  function finishSnap(index) {
    snapAnimating = false;
    body.classList.remove('is-snap-transition');
    setActiveStage(index);
  }

  function scrollToStage(index, behavior = 'smooth') {
    if (!snapStages.length) return;
    const targetIndex = clamp(index, 0, snapStages.length - 1);
    const targetTop = getStageTop(targetIndex);
    const startTime = performance.now();
    const timeoutMs = behavior === 'auto' ? 10 : 900;

    snapAnimating = behavior !== 'auto';
    body.classList.add('is-snap-transition');
    setActiveStage(targetIndex);

    if (behavior === 'auto') {
      window.scrollTo(0, targetTop);
      finishSnap(targetIndex);
      return;
    }

    window.scrollTo({ top: targetTop, behavior });

    function settle() {
      const distance = Math.abs(window.scrollY - targetTop);
      const elapsed = performance.now() - startTime;
      if (distance <= 2 || elapsed >= timeoutMs) {
        window.scrollTo(0, targetTop);
        finishSnap(targetIndex);
        return;
      }
      window.requestAnimationFrame(settle);
    }

    window.requestAnimationFrame(settle);
  }

  function updateSnapMode() {
    snapEnabled = useSnapMode();
    docEl.classList.toggle('is-snap-mode', snapEnabled);
    body.classList.toggle('is-snap-mode', snapEnabled);

    if (!snapStages.length) return;

    if (snapEnabled) {
      setActiveStage(getNearestStageIndex());
    } else {
      snapAnimating = false;
      body.classList.remove('is-snap-transition');
      snapStages.forEach((stage) => stage.classList.remove('is-active-stage'));
    }
  }

  function shouldIgnoreSnapTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, option, [contenteditable="true"], .nav-toggle'));
  }

  function handleWheel(event) {
    if (!snapEnabled || snapStages.length < 2) return;
    if (body.classList.contains('nav-open')) return;
    if (event.ctrlKey) return;
    if (shouldIgnoreSnapTarget(event.target)) return;

    const delta = event.deltaY;
    if (Math.abs(delta) < 4) return;

    event.preventDefault();

    const now = performance.now();
    if (snapAnimating || now < wheelCooldownUntil) return;

    const direction = delta > 0 ? 1 : -1;
    const currentIndex = getNearestStageIndex();
    const nextIndex = clamp(currentIndex + direction, 0, snapStages.length - 1);

    if (nextIndex === currentIndex) return;

    wheelCooldownUntil = now + 760;
    scrollToStage(nextIndex, 'smooth');
  }

  function isTypingContext(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  }

  function handleKeydown(event) {
    if (!snapEnabled || snapStages.length < 2) return;
    if (isTypingContext(event.target)) return;

    const key = event.key;
    const currentIndex = getNearestStageIndex();

    if (['ArrowDown', 'PageDown', ' '].includes(key)) {
      event.preventDefault();
      scrollToStage(currentIndex + 1, 'smooth');
      return;
    }

    if (['ArrowUp', 'PageUp'].includes(key)) {
      event.preventDefault();
      scrollToStage(currentIndex - 1, 'smooth');
      return;
    }

    if (key === 'Home') {
      event.preventDefault();
      scrollToStage(0, 'smooth');
      return;
    }

    if (key === 'End') {
      event.preventDefault();
      scrollToStage(snapStages.length - 1, 'smooth');
    }
  }

  function attachAnchorSnap() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href === '#top') return;
        const target = document.querySelector(href);
        if (!target) return;

        if (snapEnabled && target.classList.contains('snap-stage')) {
          event.preventDefault();
          const targetIndex = snapStages.indexOf(target);
          if (targetIndex >= 0) scrollToStage(targetIndex, 'smooth');
        }
      });
    });
  }

  attachAnchorSnap();
  updateSnapMode();
  window.addEventListener('resize', updateSnapMode);
  window.addEventListener('orientationchange', updateSnapMode);
  window.addEventListener('wheel', handleWheel, { passive: false });
  document.addEventListener('keydown', handleKeydown);

  if (window.location.hash) {
    window.addEventListener('load', () => {
      const target = document.querySelector(window.location.hash);
      if (snapEnabled && target && target.classList.contains('snap-stage')) {
        const targetIndex = snapStages.indexOf(target);
        if (targetIndex >= 0) scrollToStage(targetIndex, 'auto');
      }
    });
  }

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
      'Main objective:',
      (data.get('objective') || '').toString().trim() || '—',
      '',
      'Main concern or constraint:',
      (data.get('constraint') || '').toString().trim() || '—',
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
