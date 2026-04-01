(function () {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const footer = document.querySelector('.site-footer');
  const main = document.querySelector('.guided-main');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const flowNodes = Array.from(document.querySelectorAll('.flow-node[href^="#"]'));
  const flowStatus = document.querySelector('.flow-rail__status');
  const flowTrack = document.querySelector('.flow-rail__track');
  const flowBeam = document.querySelector('.flow-rail__beam');
  const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
  const panels = Array.from(document.querySelectorAll('.snap-panel[id]'));
  const year = document.getElementById('year');
  const form = document.getElementById('application-form');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const guidedDesktopMedia = window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)');

  let activeIndex = 0;
  let activePanelId = panels[0]?.id || 'home';
  let guidedEnabled = false;
  let isAnimating = false;
  let animationFrame = 0;
  let settleTimer = 0;
  let lockUntil = 0;
  let rafResize = 0;
  let hasLoadedHash = false;

  function headerHeight() {
    return header ? header.offsetHeight : 0;
  }

  function panelTargetY(index) {
    const panel = panels[index];
    if (!panel) return 0;
    return Math.max(0, Math.round(panel.offsetTop));
  }

  function footerTargetY() {
    if (!footer) return panelTargetY(panels.length - 1);
    return Math.max(0, Math.round(footer.offsetTop - headerHeight() + 12));
  }

  function footerIsVisible() {
    if (!footer) return false;
    return window.scrollY >= footerTargetY() - 8;
  }

  function normalizedDelta(event) {
    if (event.deltaMode === 1) return event.deltaY * 16;
    if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
    return event.deltaY;
  }

  function isEditableTarget(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, option, [contenteditable="true"]'));
  }

  function isInsideMain(target) {
    if (!(target instanceof Element)) return false;
    if (!main) return false;
    return main.contains(target) || target === document.documentElement || target === document.body;
  }

  function nearestPanelIndex(y = window.scrollY) {
    if (!panels.length) return 0;

    const probe = y + headerHeight() + 24;
    let winner = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    panels.forEach((panel, index) => {
      const distance = Math.abs(panel.offsetTop - probe);
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
      link.addEventListener('click', () => closeNav());
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!header?.classList.contains('nav-open')) return;
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
  onScrollHeader();

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

  function updateFlowRail(index) {
    if (!flowNodes.length) return;

    flowNodes.forEach((node, i) => {
      node.classList.toggle('is-current', i === index);
      node.classList.toggle('is-passed', i < index);
      node.classList.toggle('is-future', i > index);
    });

    const activeNode = flowNodes[index];
    if (!activeNode) return;

    const step = panels[index]?.dataset.step || String(index + 1).padStart(2, '0');
    const title = activeNode.querySelector('.flow-node__title')?.textContent?.trim() || activeNode.textContent?.trim() || 'Chapter';
    if (flowStatus) flowStatus.textContent = `Chapter ${step} · ${title}`;

    if (flowBeam && flowTrack) {
      const nodeRect = activeNode.getBoundingClientRect();
      const trackRect = flowTrack.getBoundingClientRect();
      const beamTop = Math.max(0, nodeRect.top + nodeRect.height * 0.5 - trackRect.top - 5);
      flowBeam.style.top = `${beamTop}px`;
      flowTrack.style.setProperty('--beam-top', `${beamTop}px`);
    }
  }

  function setActivePanel(id, options = {}) {
    if (!id) return;
    activePanelId = id;
    activeIndex = Math.max(0, panels.findIndex((panel) => panel.id === id));
    body.dataset.panel = id;

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const match = href === `#${id}` || (id === 'home' && href === '#home');
      link.classList.toggle('is-active', match);
      if (href === '#home') {
        if (match) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
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

  setActivePanel(activePanelId);

  function syncActiveFromScroll(forceHash) {
    if (!panels.length) return;
    const index = footerIsVisible() ? panels.length - 1 : nearestPanelIndex();
    const panel = panels[index];
    if (!panel) return;
    setActivePanel(panel.id, { updateHash: Boolean(forceHash) && !footerIsVisible() });
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

  function lockFor(ms) {
    lockUntil = performance.now() + ms;
  }

  function animateTo(y, opts = {}) {
    const targetY = Math.max(0, Math.round(y));
    const targetIndex = typeof opts.index === 'number' ? opts.index : nearestPanelIndex(targetY);
    const targetPanel = panels[targetIndex];
    if (targetPanel) setActivePanel(targetPanel.id, { updateHash: false });

    cancelAnimation();

    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      if (targetPanel) setActivePanel(targetPanel.id, { updateHash: opts.updateHash !== false });
      lockFor(160);
      return;
    }

    const duration = Math.min(980, Math.max(640, Math.abs(distance) * 0.62));
    const startTime = performance.now();
    isAnimating = true;
    body.classList.add('is-chapter-animating');
    lockFor(duration + 180);

    function step(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = easing(progress);
      const nextY = startY + distance * eased;
      window.scrollTo(0, nextY);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY);
        animationFrame = 0;
        isAnimating = false;
        body.classList.remove('is-chapter-animating');
        if (targetPanel) setActivePanel(targetPanel.id, { updateHash: opts.updateHash !== false });
      }
    }

    animationFrame = requestAnimationFrame(step);
  }

  function goToIndex(index, opts = {}) {
    const clamped = Math.max(0, Math.min(panels.length - 1, index));
    const panel = panels[clamped];
    if (!panel) return;
    animateTo(panelTargetY(clamped), {
      index: clamped,
      updateHash: opts.updateHash !== false
    });
  }

  function goToFooter() {
    if (!footer) return;
    animateTo(footerTargetY(), { index: panels.length - 1, updateHash: false });
  }

  function canGuideNow() {
    return guidedDesktopMedia.matches && !prefersReducedMotion.matches && window.innerHeight >= 700;
  }

  function updateGuideMode() {
    guidedEnabled = canGuideNow();
    root.classList.toggle('is-guided', guidedEnabled);
    body.classList.toggle('is-guided-mode', guidedEnabled);

    if (!guidedEnabled) {
      cancelAnimation();
      clearTimeout(settleTimer);
      body.classList.remove('is-chapter-animating');
    }

    syncActiveFromScroll(false);
  }

  function goRelative(direction) {
    if (!panels.length) return;

    if (footerIsVisible()) {
      if (direction < 0) goToIndex(panels.length - 1);
      return;
    }

    const index = currentIndex();
    if (direction > 0 && index === panels.length - 1) {
      goToFooter();
      return;
    }

    if (direction < 0 && index === 0) {
      goToIndex(0);
      return;
    }

    goToIndex(index + direction);
  }

  function scheduleSettle() {
    if (!guidedEnabled || isAnimating) return;
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (!guidedEnabled || isAnimating) return;
      if (performance.now() < lockUntil) return;
      if (footerIsVisible()) return;

      const index = nearestPanelIndex();
      const targetY = panelTargetY(index);
      if (Math.abs(window.scrollY - targetY) <= 6) {
        setActivePanel(panels[index]?.id || activePanelId, { updateHash: true });
        return;
      }

      animateTo(targetY, { index, updateHash: true });
    }, 110);
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
      goToIndex(index);
      return;
    }

    animateTo(Math.max(0, section.offsetTop - headerHeight()), { updateHash: true });
  }

  anchorLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    link.addEventListener('click', handleAnchorNavigation);
  });

  function handleWheel(event) {
    if (!guidedEnabled) return;
    if (body.classList.contains('nav-open')) return;
    if (event.ctrlKey || event.metaKey) return;
    if (isEditableTarget(event.target)) return;

    const deltaY = normalizedDelta(event);
    if (Math.abs(deltaY) < 4) return;

    event.preventDefault();

    if (performance.now() < lockUntil || isAnimating) return;

    const direction = deltaY > 0 ? 1 : -1;
    goRelative(direction);
  }

  window.addEventListener('wheel', handleWheel, { passive: false, capture: true });

  window.addEventListener('keydown', (event) => {
    if (!guidedEnabled) return;
    if (body.classList.contains('nav-open')) return;

    const activeEl = document.activeElement;
    if (activeEl && /INPUT|TEXTAREA|SELECT/.test(activeEl.tagName)) return;

    const steppedKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'];
    if (!steppedKeys.includes(event.key)) return;

    event.preventDefault();

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
      goToIndex(0);
      return;
    }

    if (event.key === 'End') {
      goToIndex(panels.length - 1);
    }
  }, { capture: true });

  window.addEventListener('scroll', () => {
    onScrollHeader();
    syncActiveFromScroll(false);
    scheduleSettle();
  }, { passive: true });

  function handleResize() {
    cancelAnimationFrame(rafResize);
    rafResize = requestAnimationFrame(() => {
      updateGuideMode();
      updateFlowRail(currentIndex());
      if (guidedEnabled && !footerIsVisible()) {
        const index = nearestPanelIndex();
        setActivePanel(panels[index]?.id || activePanelId);
      }
    });
  }

  if (typeof guidedDesktopMedia.addEventListener === 'function') {
    guidedDesktopMedia.addEventListener('change', updateGuideMode);
  } else if (typeof guidedDesktopMedia.addListener === 'function') {
    guidedDesktopMedia.addListener(updateGuideMode);
  }

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', updateGuideMode);
  } else if (typeof prefersReducedMotion.addListener === 'function') {
    prefersReducedMotion.addListener(updateGuideMode);
  }

  window.addEventListener('resize', handleResize, { passive: true });

  window.addEventListener('load', () => {
    if (hasLoadedHash) return;
    hasLoadedHash = true;
    updateGuideMode();

    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      const index = target instanceof HTMLElement ? panels.findIndex((panel) => panel.id === target.id) : -1;
      if (index >= 0) {
        window.scrollTo(0, panelTargetY(index));
        setActivePanel(panels[index].id, { updateHash: true });
      } else if (target instanceof HTMLElement) {
        window.scrollTo(0, Math.max(0, target.offsetTop - headerHeight()));
      }
    } else {
      syncActiveFromScroll(false);
    }
  });

  if (year) year.textContent = new Date().getFullYear();

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
      'AZRO Bitcoin Reserve Program application',
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
      'Submitted from azrosystems.com static Reserve Review form.'
    ];

    const subject = encodeURIComponent(`AZRO Reserve Review — ${business}`);
    const bodyText = encodeURIComponent(lines.join('\n'));
    const emailTarget = form.getAttribute('data-contact-email') || 'support@azrosystems.com';
    const href = `mailto:${emailTarget}?subject=${subject}&body=${bodyText}`;

    window.location.href = href;
    if (status) status.textContent = 'Your email app should open with a pre-filled application. If nothing happens, email support@azrosystems.com directly.';
    track('submit_application');
  });
})();
