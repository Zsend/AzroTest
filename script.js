(function () {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const footer = document.querySelector('.site-footer');
  const railCard = document.querySelector('.flow-rail__card');
  const railBeam = document.querySelector('.flow-rail__beam');
  const flowCurrentIndex = document.getElementById('flow-current-index');
  const flowCurrentTitle = document.getElementById('flow-current-title');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const flowLinks = Array.from(document.querySelectorAll('.flow-node[href^="#"]'));
  const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
  const panels = Array.from(document.querySelectorAll('.snap-panel[id]'));
  const year = document.getElementById('year');
  const form = document.getElementById('application-form');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopGuideMedia = window.matchMedia('(min-width: 1281px) and (min-height: 780px) and (pointer: fine)');

  const panelMeta = flowLinks.reduce((acc, link, index) => {
    const href = link.getAttribute('href') || '';
    const id = href.startsWith('#') ? href.slice(1) : href;
    if (!id) return acc;
    acc[id] = {
      index: index + 1,
      title: (link.querySelector('.flow-node__title')?.textContent || id).trim()
    };
    return acc;
  }, {});

  let activePanelId = panels[0]?.id || 'home';
  let guidedEnabled = false;
  let autoScrolling = false;
  let transitioningPanel = false;
  let pendingPanelId = null;
  let autoScrollTimer = null;
  let wheelAccumulator = 0;
  let wheelResetTimer = null;
  let wheelCooldownUntil = 0;
  let scrollAnimationFrame = 0;
  let settleTimer = 0;

  function getHeaderHeight() {
    if (header) return header.offsetHeight || 76;
    const raw = getComputedStyle(root).getPropertyValue('--header-h').trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 76;
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
      if (!header?.classList.contains('nav-open')) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (header.contains(target)) return;
      closeNav();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
  }

  function onScrollChrome() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScrollChrome();
  window.addEventListener('scroll', onScrollChrome, { passive: true });

  function getPanelIndexById(id) {
    return panels.findIndex((panel) => panel.id === id);
  }

  function updateHashForPanel(id) {
    if (!id || !window.history?.replaceState) return;
    const nextHash = `#${id}`;
    if (window.location.hash === nextHash) return;
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, '', nextUrl);
  }

  function updateBeamPosition(id, immediate = false) {
    if (!railCard || !railBeam || !id) return;
    const targetLink = flowLinks.find((link) => (link.getAttribute('href') || '').slice(1) === id);
    if (!targetLink) return;

    const cardRect = railCard.getBoundingClientRect();
    const linkRect = targetLink.getBoundingClientRect();
    const beamSize = railBeam.offsetHeight || 16;
    const y = (linkRect.top - cardRect.top) + linkRect.height / 2 - beamSize / 2;

    if (immediate) {
      railBeam.style.transition = 'none';
    }

    railCard.style.setProperty('--flow-beam-y', `${Math.max(0, y)}px`);
    railCard.style.setProperty('--flow-beam-opacity', '1');

    if (immediate) {
      requestAnimationFrame(() => {
        railBeam.style.removeProperty('transition');
      });
    }
  }

  function updateRailMeta(id, immediateBeam = false) {
    const meta = panelMeta[id];
    if (!meta) return;

    if (flowCurrentIndex) flowCurrentIndex.textContent = String(meta.index).padStart(2, '0');
    if (flowCurrentTitle) flowCurrentTitle.textContent = meta.title;

    if (railCard) {
      const lastIndex = Math.max(1, panels.length - 1);
      const progressScale = panels.length <= 1 ? 1 : (meta.index - 1) / lastIndex;
      railCard.style.setProperty('--flow-progress-scale', String(progressScale));
    }

    updateBeamPosition(id, immediateBeam);
  }

  function setActivePanel(id, immediateBeam = false) {
    if (!id) return;
    activePanelId = id;
    body.dataset.panel = id;

    const activeIndex = getPanelIndexById(id);

    panels.forEach((panel, index) => {
      panel.classList.toggle('is-current-panel', panel.id === id);
      panel.classList.toggle('is-past-panel', activeIndex >= 0 && index < activeIndex);
      panel.classList.toggle('is-future-panel', activeIndex >= 0 && index > activeIndex);
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const isMatch = href === `#${id}` || (id === 'home' && href === '#home');
      link.classList.toggle('is-active', isMatch);
      if (isMatch) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    flowLinks.forEach((link, index) => {
      const href = link.getAttribute('href') || '';
      const linkId = href.startsWith('#') ? href.slice(1) : href;
      const isCurrent = linkId === id;
      const isComplete = activeIndex >= 0 && index < activeIndex;
      link.classList.toggle('is-current', isCurrent);
      link.classList.toggle('is-complete', isComplete);
    });

    updateRailMeta(id, immediateBeam);
  }

  setActivePanel(activePanelId, true);

  function getNearestPanelIndex() {
    if (!panels.length) return 0;
    const headerHeight = getHeaderHeight();
    const viewportMid = window.scrollY + headerHeight + (window.innerHeight - headerHeight) * 0.48;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    panels.forEach((panel, index) => {
      const panelMid = panel.offsetTop + panel.offsetHeight * 0.5;
      const distance = Math.abs(panelMid - viewportMid);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function getActivePanelIndex() {
    const explicitIndex = getPanelIndexById(activePanelId);
    return explicitIndex >= 0 ? explicitIndex : getNearestPanelIndex();
  }

  function getCurrentPanel() {
    return panels[getActivePanelIndex()] || null;
  }

  function currentPanelAllowsNativeTravel(direction) {
    const panel = getCurrentPanel();
    if (!panel) return false;

    const headerHeight = getHeaderHeight();
    const rect = panel.getBoundingClientRect();
    const usableHeight = window.innerHeight - headerHeight;
    const panelIsTallerThanViewport = rect.height > usableHeight + 16;

    if (!panelIsTallerThanViewport) return false;

    if (direction > 0) {
      return rect.top <= headerHeight + 8 && rect.bottom > window.innerHeight + 16;
    }

    if (direction < 0) {
      return rect.top < headerHeight - 16;
    }

    return false;
  }

  function allowNativeEdgeScroll(direction) {
    const currentIndex = getActivePanelIndex();
    const currentPanel = panels[currentIndex];

    if (currentPanelAllowsNativeTravel(direction)) return true;

    if (direction < 0 && currentIndex === 0 && window.scrollY <= 2) {
      return true;
    }

    if (direction > 0 && currentIndex === panels.length - 1) {
      if (!currentPanel) return true;
      const currentRect = currentPanel.getBoundingClientRect();
      const footerRect = footer ? footer.getBoundingClientRect() : null;

      if (footerRect && footerRect.top < window.innerHeight - 8) return true;
      if (currentRect.bottom <= window.innerHeight + 12) return true;
      if (window.scrollY >= currentPanel.offsetTop - getHeaderHeight() + 6) return true;
    }

    if (footer) {
      const footerRect = footer.getBoundingClientRect();
      if (footerRect.top < window.innerHeight && direction < 0) return true;
    }

    return false;
  }

  function clearTransitionClasses() {
    panels.forEach((panel) => {
      panel.classList.remove('is-leaving-next', 'is-leaving-prev', 'is-entering-next', 'is-entering-prev');
    });
  }

  function cancelScrollAnimation() {
    if (scrollAnimationFrame) {
      window.cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = 0;
    }
  }

  function animateWindowScroll(targetTop, duration) {
    return new Promise((resolve) => {
      cancelScrollAnimation();

      const startY = window.scrollY;
      const delta = targetTop - startY;

      if (Math.abs(delta) < 1) {
        window.scrollTo(0, targetTop);
        resolve();
        return;
      }

      const startTime = performance.now();
      const ease = (t) => (t < 0.5
        ? 16 * t * t * t * t * t
        : 1 - Math.pow(-2 * t + 2, 5) / 2);

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = ease(progress);
        const nextY = startY + delta * eased;
        window.scrollTo(0, nextY);

        if (progress < 1) {
          scrollAnimationFrame = window.requestAnimationFrame(tick);
          return;
        }

        scrollAnimationFrame = 0;
        window.scrollTo(0, targetTop);
        resolve();
      };

      scrollAnimationFrame = window.requestAnimationFrame(tick);
    });
  }

  function finishTransition(targetId) {
    transitioningPanel = false;
    autoScrolling = false;
    pendingPanelId = null;
    clearTransitionClasses();
    body.classList.remove('is-panel-transitioning', 'is-auto-scrolling');
    body.removeAttribute('data-scroll-direction');
    setActivePanel(targetId || activePanelId);
    updateHashForPanel(targetId || activePanelId);
  }

  function nativeScrollToPanel(target, smooth = true) {
    const headerOffset = getHeaderHeight();
    const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);
    autoScrolling = true;
    body.classList.add('is-auto-scrolling');
    window.scrollTo({ top: targetTop, behavior: smooth ? 'smooth' : 'auto' });
    setActivePanel(target.id);
    updateHashForPanel(target.id);
    window.clearTimeout(autoScrollTimer);
    autoScrollTimer = window.setTimeout(() => {
      autoScrolling = false;
      body.classList.remove('is-auto-scrolling');
    }, smooth ? 700 : 80);
  }

  function scrollToPanel(target, options = {}) {
    if (!(target instanceof HTMLElement)) return;
    const { smooth = true, useTransition = guidedEnabled, quick = false } = options;

    const headerOffset = getHeaderHeight();
    const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);

    if (!guidedEnabled || !useTransition) {
      nativeScrollToPanel(target, smooth);
      return;
    }

    if (transitioningPanel) return;

    const fromPanel = getCurrentPanel();
    const fromIndex = fromPanel ? panels.indexOf(fromPanel) : getActivePanelIndex();
    const toIndex = panels.indexOf(target);
    const direction = toIndex >= fromIndex ? 1 : -1;
    const fromId = fromPanel?.id || activePanelId;
    const samePanel = fromId === target.id;

    if (samePanel && Math.abs(window.scrollY - targetTop) < 8) {
      setActivePanel(target.id);
      updateHashForPanel(target.id);
      return;
    }

    transitioningPanel = true;
    autoScrolling = true;
    pendingPanelId = target.id;
    wheelAccumulator = 0;
    body.classList.add('is-auto-scrolling', 'is-panel-transitioning');
    body.dataset.scrollDirection = direction > 0 ? 'forward' : 'backward';
    clearTransitionClasses();

    if (!samePanel && fromPanel) {
      fromPanel.classList.add(direction > 0 ? 'is-leaving-next' : 'is-leaving-prev');
      target.classList.add(direction > 0 ? 'is-entering-next' : 'is-entering-prev');
    }

    setActivePanel(target.id);
    updateBeamPosition(target.id);

    const duration = quick ? 560 : 980;

    animateWindowScroll(targetTop, duration)
      .then(() => {
        finishTransition(target.id);
      })
      .catch(() => {
        finishTransition(target.id);
      });
  }

  function goRelative(direction) {
    if (!panels.length) return;
    const currentIndex = getActivePanelIndex();
    const nextIndex = Math.min(panels.length - 1, Math.max(0, currentIndex + direction));
    if (nextIndex === currentIndex) {
      autoScrolling = false;
      transitioningPanel = false;
      body.classList.remove('is-auto-scrolling', 'is-panel-transitioning');
      body.removeAttribute('data-scroll-direction');
      return;
    }
    scrollToPanel(panels[nextIndex], { useTransition: guidedEnabled });
  }

  function isFocusableFormElement(element) {
    if (!(element instanceof Element)) return false;
    return Boolean(element.closest('input, textarea, select, option, [contenteditable="true"]'));
  }

  function maybeSettleToNearestPanel() {
    if (!guidedEnabled || autoScrolling || transitioningPanel) return;
    if (body.classList.contains('nav-open')) return;
    if (!panels.length) return;

    const currentPanel = getCurrentPanel();
    if (!currentPanel) return;
    if (currentPanelAllowsNativeTravel(1) || currentPanelAllowsNativeTravel(-1)) return;

    if (footer) {
      const footerRect = footer.getBoundingClientRect();
      if (footerRect.top < window.innerHeight - 40) return;
    }

    const targetTop = Math.max(0, currentPanel.offsetTop - getHeaderHeight());
    if (Math.abs(window.scrollY - targetTop) < 24) return;

    scrollToPanel(currentPanel, { useTransition: guidedEnabled, quick: true });
  }

  function queueSettle() {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(maybeSettleToNearestPanel, 120);
  }

  if ('IntersectionObserver' in window && panels.length) {
    const panelObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible || !(visible.target instanceof HTMLElement)) return;
        if (pendingPanelId && visible.target.id !== pendingPanelId && transitioningPanel) return;
        setActivePanel(visible.target.id);
      },
      {
        rootMargin: `-${Math.round(getHeaderHeight() + 80)}px 0px -32% 0px`,
        threshold: [0.18, 0.35, 0.56, 0.72]
      }
    );

    panels.forEach((panel) => panelObserver.observe(panel));
  } else {
    window.addEventListener('scroll', () => {
      if (transitioningPanel) return;
      const panel = getCurrentPanel();
      if (panel) setActivePanel(panel.id);
    }, { passive: true });
  }

  function updateGuideMode() {
    const wasGuided = guidedEnabled;
    guidedEnabled = desktopGuideMedia.matches && !prefersReducedMotion.matches;
    root.classList.toggle('is-guided', guidedEnabled);

    if (!guidedEnabled) {
      autoScrolling = false;
      transitioningPanel = false;
      pendingPanelId = null;
      wheelAccumulator = 0;
      body.classList.remove('is-auto-scrolling', 'is-panel-transitioning');
      body.removeAttribute('data-scroll-direction');
      clearTransitionClasses();
      cancelScrollAnimation();
    }

    requestAnimationFrame(() => {
      const current = getCurrentPanel();
      if (current) {
        setActivePanel(current.id, true);
      } else {
        updateRailMeta(activePanelId, true);
      }
      if (guidedEnabled && !wasGuided) queueSettle();
    });
  }

  updateGuideMode();
  if (desktopGuideMedia.addEventListener) desktopGuideMedia.addEventListener('change', updateGuideMode);
  else desktopGuideMedia.addListener(updateGuideMode);
  if (prefersReducedMotion.addEventListener) prefersReducedMotion.addEventListener('change', updateGuideMode);
  else prefersReducedMotion.addListener(updateGuideMode);
  window.addEventListener('resize', () => {
    updateGuideMode();
    queueSettle();
  });

  window.addEventListener(
    'wheel',
    (event) => {
      if (!guidedEnabled) return;
      if (body.classList.contains('nav-open')) return;
      if (event.ctrlKey || event.metaKey) return;
      if (isFocusableFormElement(event.target)) return;

      const deltaY = event.deltaY;
      if (Math.abs(deltaY) < 10) return;
      const direction = deltaY > 0 ? 1 : -1;

      if (allowNativeEdgeScroll(direction)) {
        wheelAccumulator = 0;
        queueSettle();
        return;
      }

      event.preventDefault();
      if (transitioningPanel || autoScrolling || Date.now() < wheelCooldownUntil) return;

      wheelAccumulator += deltaY;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAccumulator = 0;
      }, 120);

      if (Math.abs(wheelAccumulator) < 40) return;

      const resolvedDirection = wheelAccumulator > 0 ? 1 : -1;
      wheelAccumulator = 0;
      wheelCooldownUntil = Date.now() + 900;
      goRelative(resolvedDirection);
    },
    { passive: false }
  );

  window.addEventListener('keydown', (event) => {
    if (!guidedEnabled) return;
    if (body.classList.contains('nav-open')) return;

    const activeEl = document.activeElement;
    if (activeEl && /INPUT|TEXTAREA|SELECT/.test(activeEl.tagName)) return;

    const isSpace = event.key === ' ' || event.code === 'Space';

    if (event.key === 'ArrowDown' || event.key === 'PageDown' || (isSpace && !event.shiftKey)) {
      if (allowNativeEdgeScroll(1)) return;
      event.preventDefault();
      goRelative(1);
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'PageUp' || (isSpace && event.shiftKey)) {
      if (allowNativeEdgeScroll(-1)) return;
      event.preventDefault();
      goRelative(-1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      scrollToPanel(panels[0], { useTransition: guidedEnabled });
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      scrollToPanel(panels[panels.length - 1], { useTransition: guidedEnabled });
    }
  });

  function handleAnchorNavigation(event) {
    const link = event.currentTarget;
    if (!(link instanceof HTMLAnchorElement)) return;
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const section = document.querySelector(href);
    if (!(section instanceof HTMLElement)) return;

    event.preventDefault();
    closeNav();
    scrollToPanel(section, { useTransition: guidedEnabled });
  }

  anchorLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    link.addEventListener('click', handleAnchorNavigation);
  });

  window.addEventListener('scroll', () => {
    if (!guidedEnabled) return;
    if (transitioningPanel || autoScrolling) return;
    queueSettle();
  }, { passive: true });

  window.addEventListener('load', () => {
    if (!window.location.hash) {
      updateRailMeta(activePanelId, true);
      queueSettle();
      return;
    }

    const target = document.querySelector(window.location.hash);
    if (!(target instanceof HTMLElement)) return;

    window.requestAnimationFrame(() => {
      const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY - getHeaderHeight());
      window.scrollTo({ top: targetTop, behavior: 'auto' });
      setActivePanel(target.id, true);
      updateHashForPanel(target.id);
      queueSettle();
    });
  });

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
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.16
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
      if (status) {
        status.textContent = 'Please add your name, business, and email before creating the application email.';
      }
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
    if (status) {
      status.textContent = 'Your email app should open with a pre-filled application. If nothing happens, email support@azrosystems.com directly.';
    }
    track('submit_application');
  });
})();
