(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const footer = document.querySelector('.site-footer');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const flowNodes = Array.from(document.querySelectorAll('.flow-node[href^="#"]'));
  const flowStatus = document.querySelector('.flow-rail__status');
  const flowTrack = document.querySelector('.flow-rail__track');
  const flowBeam = document.querySelector('.flow-rail__beam');
  const signalLock = document.querySelector('.signal-lock');
  const signalLockBeam = document.querySelector('.signal-lock__beam');
  const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
  const panels = Array.from(document.querySelectorAll('.snap-panel[id]'));
  const year = document.getElementById('year');
  const form = document.getElementById('application-form');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopGuideMedia = window.matchMedia('(min-width: 1181px) and (hover: hover) and (pointer: fine)');

  let activeIndex = 0;
  let activePanelId = panels[0]?.id || 'home';
  let guidedEnabled = false;
  let isAnimating = false;
  let animationFrame = 0;
  let settleTimer = 0;
  let resizeRaf = 0;
  let lockUntil = 0;
  let hasAppliedInitialState = false;

  function headerHeight() {
    return header ? Math.round(header.getBoundingClientRect().height) : 0;
  }

  function normalizedDelta(event) {
    if (event.deltaMode === 1) return event.deltaY * 16;
    if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
    return event.deltaY;
  }

  function isEditableTarget(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, option, [contenteditable="true"]'));
  }

  function closeNav() {
    if (!navToggle || !header) return;
    navToggle.setAttribute('aria-expanded', 'false');
    header.classList.remove('nav-open');
    body.classList.remove('nav-open');
  }

  function openNav() {
    if (!navToggle || !header) return;
    navToggle.setAttribute('aria-expanded', 'true');
    header.classList.add('nav-open');
    body.classList.add('nav-open');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeNav();
      else openNav();
    });

    navLinks.forEach((link) => link.addEventListener('click', closeNav));

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !header?.classList.contains('nav-open')) return;
      if (header.contains(target)) return;
      closeNav();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
  }

  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  function panelTargetY(index) {
    const panel = panels[index];
    if (!panel) return 0;
    return Math.max(0, Math.round(panel.offsetTop));
  }

  function footerTargetY() {
    if (!footer) return panelTargetY(panels.length - 1);
    return Math.max(0, Math.round(footer.offsetTop - Math.max(0, headerHeight() * 0.16)));
  }

  function footerIsVisible() {
    if (!footer) return false;
    return window.scrollY + window.innerHeight * 0.1 >= footer.offsetTop;
  }

  function nearestPanelIndex(y = window.scrollY) {
    if (!panels.length) return 0;
    let winner = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    panels.forEach((panel, index) => {
      const targetY = panelTargetY(index);
      const distance = Math.abs(targetY - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        winner = index;
      }
    });
    return winner;
  }

  function currentIndex() {
    const explicit = panels.findIndex((panel) => panel.id === activePanelId);
    if (explicit >= 0) return explicit;
    return nearestPanelIndex();
  }

  function updatePanelClasses(index) {
    panels.forEach((panel, i) => {
      panel.classList.remove('is-active', 'is-before', 'is-after', 'is-hidden-before', 'is-hidden-after');
      if (i === index) panel.classList.add('is-active');
      else if (i === index - 1) panel.classList.add('is-before');
      else if (i === index + 1) panel.classList.add('is-after');
      else if (i < index - 1) panel.classList.add('is-hidden-before');
      else if (i > index + 1) panel.classList.add('is-hidden-after');
    });
  }

  function updateSignalLock(index) {
    if (!signalLock || !signalLockBeam || panels.length < 2) return;
    const progress = panels.length === 1 ? 0 : index / (panels.length - 1);
    signalLock.style.setProperty('--signal-progress', `${progress * 100}%`);
    signalLockBeam.style.top = `${progress * 100}%`;
  }

  function updateFlowRail(index) {
    if (flowNodes.length) {
      flowNodes.forEach((node, i) => {
        node.classList.toggle('is-current', i === index);
        node.classList.toggle('is-passed', i < index);
        node.classList.toggle('is-future', i > index);
      });

      const activeNode = flowNodes[index];
      if (activeNode) {
        const step = panels[index]?.dataset.step || String(index + 1).padStart(2, '0');
        const title = activeNode.querySelector('.flow-node__title')?.textContent?.trim() || 'Chapter';
        if (flowStatus) flowStatus.textContent = `Chapter ${step} · ${title}`;

        if (flowBeam && flowTrack) {
          const nodeRect = activeNode.getBoundingClientRect();
          const trackRect = flowTrack.getBoundingClientRect();
          const beamTop = Math.max(0, nodeRect.top + nodeRect.height * 0.5 - trackRect.top - 5);
          flowBeam.style.top = `${beamTop}px`;
          flowTrack.style.setProperty('--beam-top', `${beamTop}px`);
        }
      }
    }

    updateSignalLock(index);
  }

  function setActivePanel(id, options = {}) {
    if (!id) return;
    const nextIndex = Math.max(0, panels.findIndex((panel) => panel.id === id));
    activePanelId = id;
    activeIndex = nextIndex;
    body.dataset.panel = id;

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const match = href === `#${id}`;
      link.classList.toggle('is-active', match);
      if (match) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    updatePanelClasses(activeIndex);
    updateFlowRail(activeIndex);

    if (options.updateHash) {
      try {
        history.replaceState(null, '', `#${id}`);
      } catch (error) {
        // noop
      }
    }
  }

  function setActiveIndex(index, options = {}) {
    const clamped = Math.max(0, Math.min(panels.length - 1, index));
    const panel = panels[clamped];
    if (!panel) return;
    setActivePanel(panel.id, options);
  }

  function easing(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function cancelAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    isAnimating = false;
    body.classList.remove('is-chapter-animating');
  }

  function animateTo(y, opts = {}) {
    const targetY = Math.max(0, Math.round(y));
    const startY = window.scrollY;
    const distance = targetY - startY;
    const direction = opts.direction || (distance >= 0 ? 'down' : 'up');

    cancelAnimation();
    body.dataset.scrollDirection = direction;

    if (Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      if (typeof opts.index === 'number') setActiveIndex(opts.index, { updateHash: Boolean(opts.updateHash) });
      lockUntil = performance.now() + 180;
      return;
    }

    const duration = Math.min(900, Math.max(560, Math.abs(distance) * 0.5));
    const startTime = performance.now();
    isAnimating = true;
    body.classList.add('is-chapter-animating');
    lockUntil = startTime + duration + 180;

    function frame(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = easing(progress);
      window.scrollTo(0, startY + distance * eased);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(frame);
      } else {
        window.scrollTo(0, targetY);
        animationFrame = 0;
        isAnimating = false;
        body.classList.remove('is-chapter-animating');
        if (typeof opts.index === 'number') setActiveIndex(opts.index, { updateHash: Boolean(opts.updateHash) });
        else setActiveIndex(nearestPanelIndex(targetY), { updateHash: Boolean(opts.updateHash) && !footerIsVisible() });
      }
    }

    animationFrame = requestAnimationFrame(frame);
  }

  function goToIndex(index, opts = {}) {
    const clamped = Math.max(0, Math.min(panels.length - 1, index));
    const previousIndex = currentIndex();
    setActiveIndex(clamped, { updateHash: false });
    animateTo(panelTargetY(clamped), {
      index: clamped,
      updateHash: opts.updateHash !== false,
      direction: opts.direction || (clamped >= previousIndex ? 'down' : 'up')
    });
  }

  function goToFooter() {
    if (!footer) return;
    animateTo(footerTargetY(), { updateHash: false, direction: 'down' });
  }

  function settleToNearest() {
    if (!guidedEnabled || isAnimating || body.classList.contains('nav-open')) return;
    if (performance.now() < lockUntil) return;
    if (footerIsVisible()) {
      setActiveIndex(panels.length - 1, { updateHash: false });
      return;
    }

    const index = nearestPanelIndex();
    const targetY = panelTargetY(index);
    if (Math.abs(window.scrollY - targetY) < 8) {
      setActiveIndex(index, { updateHash: false });
      return;
    }

    goToIndex(index, { updateHash: false, direction: index >= currentIndex() ? 'down' : 'up' });
  }

  function scheduleSettle() {
    if (!guidedEnabled || isAnimating) return;
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settleToNearest, 130);
  }

  function canGuideNow() {
    return desktopGuideMedia.matches && !prefersReducedMotion.matches && panels.length > 1 && window.innerHeight >= 720;
  }

  function updateGuideMode() {
    guidedEnabled = canGuideNow();
    root.classList.toggle('is-guided', guidedEnabled);
    if (!guidedEnabled) {
      cancelAnimation();
      clearTimeout(settleTimer);
      body.classList.remove('is-chapter-animating');
    }
    setActiveIndex(footerIsVisible() ? panels.length - 1 : nearestPanelIndex(), { updateHash: false });
  }

  function goRelative(direction) {
    if (!panels.length) return;
    if (footerIsVisible()) {
      if (direction < 0) goToIndex(panels.length - 1, { direction: 'up' });
      return;
    }

    const index = currentIndex();
    if (direction > 0 && index === panels.length - 1) {
      goToFooter();
      return;
    }
    if (direction < 0 && index === 0) {
      goToIndex(0, { direction: 'up' });
      return;
    }

    goToIndex(index + direction, { direction: direction > 0 ? 'down' : 'up' });
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

  function handleAnchorNavigation(event) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLAnchorElement)) return;
    const href = target.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    const section = document.querySelector(href);
    if (!(section instanceof HTMLElement)) return;

    event.preventDefault();
    closeNav();

    const index = panels.findIndex((panel) => panel.id === section.id);
    if (index >= 0) {
      const direction = index >= currentIndex() ? 'down' : 'up';
      goToIndex(index, { direction });
      return;
    }

    animateTo(section.offsetTop, { updateHash: true, direction: section.offsetTop >= window.scrollY ? 'down' : 'up' });
  }

  anchorLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    if (!document.querySelector(href)) return;
    link.addEventListener('click', handleAnchorNavigation);
  });

  document.addEventListener('wheel', (event) => {
    if (!guidedEnabled) return;
    if (body.classList.contains('nav-open')) return;
    if (event.ctrlKey || event.metaKey) return;
    if (isEditableTarget(event.target)) return;

    const deltaY = normalizedDelta(event);
    if (Math.abs(deltaY) < 4) return;

    event.preventDefault();

    if (performance.now() < lockUntil || isAnimating) return;
    goRelative(deltaY > 0 ? 1 : -1);
  }, { passive: false, capture: true });

  document.addEventListener('keydown', (event) => {
    if (!guidedEnabled || body.classList.contains('nav-open')) return;
    const activeEl = document.activeElement;
    if (activeEl && /INPUT|TEXTAREA|SELECT/.test(activeEl.tagName)) return;

    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
    } else {
      return;
    }

    if (performance.now() < lockUntil || isAnimating) return;

    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      goRelative(1);
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      goRelative(-1);
      return;
    }
    if (event.key === 'Home') {
      goToIndex(0, { direction: 'up' });
      return;
    }
    if (event.key === 'End') {
      goToIndex(panels.length - 1, { direction: 'down' });
    }
  });

  window.addEventListener('scroll', () => {
    onScrollHeader();
    if (!isAnimating) {
      setActiveIndex(footerIsVisible() ? panels.length - 1 : nearestPanelIndex(), { updateHash: false });
    }
    scheduleSettle();
  }, { passive: true });

  function handleResize() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      updateGuideMode();
      updateFlowRail(currentIndex());
    });
  }

  function bindMediaChange(mq, handler) {
    if ('addEventListener' in mq) mq.addEventListener('change', handler);
    else if ('addListener' in mq) mq.addListener(handler);
  }

  bindMediaChange(desktopGuideMedia, updateGuideMode);
  bindMediaChange(prefersReducedMotion, updateGuideMode);
  window.addEventListener('resize', handleResize, { passive: true });

  function applyInitialState() {
    if (hasAppliedInitialState) return;
    hasAppliedInitialState = true;
    updateGuideMode();
    onScrollHeader();

    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      const index = target instanceof HTMLElement ? panels.findIndex((panel) => panel.id === target.id) : -1;
      if (index >= 0) {
        window.scrollTo(0, panelTargetY(index));
        setActiveIndex(index, { updateHash: false });
      } else if (target instanceof HTMLElement) {
        window.scrollTo(0, target.offsetTop);
      }
    } else {
      setActiveIndex(nearestPanelIndex(), { updateHash: false });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyInitialState, { once: true });
  } else {
    applyInitialState();
  }
  window.addEventListener('load', handleResize, { once: true });
  window.addEventListener('pageshow', handleResize);

  if (year) year.textContent = String(new Date().getFullYear());

  const revealTargets = Array.from(
    document.querySelectorAll(
      '.signal-chip, .job-card, .default-card, .fail-card, .step-card, .proof-card, .fit-card, .qa-card, .showcase-card, .apply-card, .program-panel__copy, .proof-visual, .application-form, .apply-copy'
    )
  );

  if (!prefersReducedMotion.matches && 'IntersectionObserver' in window) {
    revealTargets.forEach((el) => el.classList.add('reveal-item'));
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.18
      }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  }

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

    const lines = [
      'AZRO LLC Reserve Standard application',
      '',
      `Name: ${name}`,
      `Business: ${business}`,
      `Email: ${email}`,
      `Role: ${(data.get('role') || '').toString()}`,
      `Monthly reserve budget range: ${(data.get('budget') || '').toString()}`,
      `Timeline: ${(data.get('timeline') || '').toString()}`,
      '',
      'Main objective:',
      (data.get('objective') || '').toString().trim() || '—',
      '',
      'Biggest concern or constraint:',
      (data.get('constraint') || '').toString().trim() || '—',
      '',
      'Submitted from azrosystems.com static Standard Review form.'
    ];

    const subject = encodeURIComponent(`AZRO LLC Reserve Standard — ${business}`);
    const bodyText = encodeURIComponent(lines.join('\n'));
    const emailTarget = form.getAttribute('data-contact-email') || 'support@azrosystems.com';
    window.location.href = `mailto:${emailTarget}?subject=${subject}&body=${bodyText}`;
    if (status) status.textContent = 'Your email app should open with a pre-filled application. If nothing happens, email support@azrosystems.com directly.';
    track('submit_application');
  });
})();
