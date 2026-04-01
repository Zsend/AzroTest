(function () {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const flowLinks = Array.from(document.querySelectorAll('.flow-node[href^="#"]'));
  const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
  const storyShell = document.getElementById('story-shell');
  const storyStage = document.getElementById('story-stage');
  const storyPanels = Array.from(document.querySelectorAll('.story-panel[data-panel]'));
  const applySection = document.getElementById('apply');
  const sections = [...storyPanels, applySection].filter(Boolean);
  const currentIndexEl = document.getElementById('flow-current-index');
  const currentTitleEl = document.getElementById('flow-current-title');
  const meterFill = document.getElementById('flow-meter-fill');
  const flowBeam = document.getElementById('flow-beam');
  const form = document.getElementById('application-form');
  const year = document.getElementById('year');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const guidedMedia = window.matchMedia('(min-width: 1281px) and (pointer: fine)');

  const storyIds = storyPanels.map((panel) => panel.id);
  const panelIndexById = new Map(storyPanels.map((panel, index) => [panel.id, index]));
  const flowIndexById = new Map(flowLinks.map((link, index) => [link.getAttribute('href')?.slice(1) || '', index]));
  const panelTitles = {
    home: 'Start',
    program: 'Cash jobs',
    'reserve-fit': 'Reserve fit',
    guesswork: 'Guesswork',
    process: 'System',
    proof: 'Proof',
    faq: 'Fit + FAQ',
    apply: 'Apply'
  };

  let guidedEnabled = false;
  let activePanelId = storyPanels[0]?.id || 'home';
  let storyMetrics = null;
  let autoScrolling = false;
  let animationFrame = 0;
  let snapTimer = 0;
  let wheelAccumulator = 0;
  let wheelResetTimer = 0;
  let intersectionObserver = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function headerHeight() {
    return header ? header.offsetHeight : 0;
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

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeNav();
      else openNav();
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

  function updateFlowDisplay(id) {
    const flowIndex = flowIndexById.has(id) ? flowIndexById.get(id) : flowLinks.length - 1;
    const safeIndex = clamp(flowIndex ?? 0, 0, Math.max(flowLinks.length - 1, 0));

    if (currentIndexEl) currentIndexEl.textContent = String(safeIndex + 1).padStart(2, '0');
    if (currentTitleEl) currentTitleEl.textContent = panelTitles[id] || 'Section';

    if (meterFill) {
      const pct = ((safeIndex + 1) / Math.max(flowLinks.length, 1)) * 100;
      meterFill.style.width = `${pct.toFixed(2)}%`;
    }

    if (flowBeam && flowLinks[safeIndex]) {
      const node = flowLinks[safeIndex];
      const beamY = node.offsetTop + node.offsetHeight / 2 - flowBeam.offsetHeight / 2;
      flowBeam.style.transform = `translateY(${beamY.toFixed(2)}px)`;
    }
  }

  function setActivePanel(id) {
    if (!id) return;
    activePanelId = id;
    body.dataset.panel = id;
    if (storyShell) storyShell.dataset.active = id;

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const isMatch = href === `#${id}`;
      link.classList.toggle('is-active', isMatch);
      if (isMatch) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    flowLinks.forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('is-current', href === `#${id}`);
    });

    updateFlowDisplay(id);
  }

  function clearPanelTransforms() {
    storyPanels.forEach((panel) => {
      panel.style.opacity = '';
      panel.style.transform = '';
      panel.style.filter = '';
      panel.style.zIndex = '';
      panel.classList.remove('is-active', 'is-near');
    });
  }

  function measureStory() {
    if (!storyShell || !storyStage || !storyPanels.length) return null;
    const start = Math.max(0, storyShell.offsetTop - headerHeight());
    const stageHeight = Math.max(620, window.innerHeight - headerHeight());
    const segment = stageHeight;
    const storyHeight = segment * storyPanels.length;
    const end = start + storyHeight - stageHeight;
    storyMetrics = { start, stageHeight, segment, storyHeight, end };

    if (guidedEnabled) {
      storyShell.style.height = `${storyHeight}px`;
      storyStage.style.height = `${stageHeight}px`;
      root.style.setProperty('--stage-h', `${stageHeight}px`);
    }

    return storyMetrics;
  }

  function resetStoryMeasurements() {
    if (storyShell) storyShell.style.height = '';
    if (storyStage) storyStage.style.height = '';
    root.style.removeProperty('--stage-h');
    root.style.removeProperty('--story-progress');
  }

  function storyContainsViewport() {
    const metrics = storyMetrics || measureStory();
    if (!metrics) return false;
    return window.scrollY >= metrics.start - 2 && window.scrollY <= metrics.end + 2;
  }

  function getStoryIndexFromScroll() {
    const metrics = storyMetrics || measureStory();
    if (!metrics) return 0;
    const raw = (window.scrollY - metrics.start) / metrics.segment;
    return clamp(Math.round(raw), 0, storyPanels.length - 1);
  }

  function getStoryProgress() {
    const metrics = storyMetrics || measureStory();
    if (!metrics) return 0;
    const raw = (window.scrollY - metrics.start) / metrics.segment;
    return clamp(raw, 0, storyPanels.length - 1);
  }

  function renderGuidedStory() {
    if (!guidedEnabled) return;
    const metrics = storyMetrics || measureStory();
    if (!metrics) return;

    const progress = getStoryProgress();
    const normalizedProgress = storyPanels.length > 1 ? progress / (storyPanels.length - 1) : 0;
    root.style.setProperty('--story-progress', normalizedProgress.toFixed(4));

    const activeIndex = clamp(Math.round(progress), 0, storyPanels.length - 1);
    const activePanel = storyPanels[activeIndex];
    if (activePanel) setActivePanel(activePanel.id);

    storyPanels.forEach((panel, index) => {
      const distance = index - progress;
      const absDistance = Math.abs(distance);
      const opacity = clamp(1 - absDistance * 0.92, 0, 1);
      const translateY = distance * 13;
      const translateX = distance * 2.1;
      const translateZ = -Math.min(absDistance * 170, 360);
      const scale = 1 - Math.min(absDistance * 0.072, 0.16);
      const rotateX = distance * 4.4;
      const rotateY = distance * -1.5;
      const blur = Math.min(absDistance * 10, 12);

      panel.style.opacity = opacity.toFixed(4);
      panel.style.transform = `translate3d(${translateX.toFixed(2)}%, ${translateY.toFixed(2)}%, ${translateZ.toFixed(2)}px) scale(${scale.toFixed(4)}) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      panel.style.filter = `blur(${blur.toFixed(2)}px)`;
      panel.style.zIndex = `${1000 - Math.round(absDistance * 100)}`;
      panel.classList.toggle('is-active', absDistance < 0.34);
      panel.classList.toggle('is-near', absDistance < 0.95);
    });

    if (applySection) {
      const rect = applySection.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.58 && rect.bottom > window.innerHeight * 0.28) {
        setActivePanel('apply');
      }
    }
  }

  function applyNonGuidedActiveSection() {
    if (!sections.length) return;
    const viewportMarker = window.innerHeight * 0.42;
    let best = sections[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section) => {
      if (!(section instanceof HTMLElement)) return;
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top - viewportMarker);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = section;
      }
    });

    if (best instanceof HTMLElement) setActivePanel(best.id || 'home');
  }

  function canGuide() {
    return Boolean(storyShell && storyStage && storyPanels.length && guidedMedia.matches && !prefersReducedMotion.matches && window.innerHeight >= 800);
  }

  function setupIntersectionObserver() {
    if (intersectionObserver) intersectionObserver.disconnect();
    if (!('IntersectionObserver' in window)) return;

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (guidedEnabled && storyContainsViewport()) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible || !(visible.target instanceof HTMLElement)) return;
        setActivePanel(visible.target.id || 'home');
      },
      {
        rootMargin: '-28% 0px -28% 0px',
        threshold: [0.2, 0.4, 0.6, 0.78]
      }
    );

    sections.forEach((section) => intersectionObserver?.observe(section));
  }

  function updateGuideMode() {
    const shouldGuide = canGuide();
    if (shouldGuide === guidedEnabled) {
      if (guidedEnabled) {
        measureStory();
        renderGuidedStory();
      } else {
        applyNonGuidedActiveSection();
      }
      return;
    }

    guidedEnabled = shouldGuide;
    body.classList.toggle('is-story-guided', guidedEnabled);
    root.classList.toggle('guided-story', guidedEnabled);
    closeNav();

    if (guidedEnabled) {
      measureStory();
      renderGuidedStory();
    } else {
      clearPanelTransforms();
      resetStoryMeasurements();
      applyNonGuidedActiveSection();
    }
  }

  function magneticEase(t) {
    if (t < 0.84) {
      const x = t / 0.84;
      return 1 - Math.pow(1 - x, 4) * 0.985;
    }
    const x = (t - 0.84) / 0.16;
    return 0.985 + (1 - Math.pow(1 - x, 2)) * 0.015;
  }

  function stopAnimation() {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    autoScrolling = false;
  }

  function animateToY(targetY, duration = 760) {
    stopAnimation();

    const startY = window.scrollY;
    const delta = targetY - startY;
    if (Math.abs(delta) < 2) {
      window.scrollTo(0, targetY);
      renderGuidedStory();
      return;
    }

    autoScrolling = true;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const t = clamp(elapsed / duration, 0, 1);
      const eased = magneticEase(t);
      const nextY = startY + delta * eased;
      window.scrollTo(0, nextY);
      if (guidedEnabled) renderGuidedStory();

      if (t < 1) {
        animationFrame = window.requestAnimationFrame(step);
        return;
      }

      window.scrollTo(0, targetY);
      if (guidedEnabled) renderGuidedStory();
      autoScrolling = false;
      animationFrame = 0;
    }

    animationFrame = window.requestAnimationFrame(step);
  }

  function goToStoryIndex(index, duration = 760) {
    const metrics = storyMetrics || measureStory();
    if (!metrics) return;
    const safeIndex = clamp(index, 0, storyPanels.length - 1);
    const targetY = Math.round(metrics.start + safeIndex * metrics.segment);
    animateToY(targetY, duration);
    const panel = storyPanels[safeIndex];
    if (panel) setActivePanel(panel.id);
  }

  function scrollToSection(id, duration = 760) {
    const target = document.getElementById(id);
    if (!(target instanceof HTMLElement)) return;

    if (guidedEnabled && panelIndexById.has(id)) {
      goToStoryIndex(panelIndexById.get(id), duration);
      return;
    }

    const targetY = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight() - 10);
    animateToY(targetY, duration);
    setActivePanel(id);
  }

  function snapToNearestStoryPanel(duration = 620) {
    if (!guidedEnabled || autoScrolling || !storyContainsViewport()) return;
    const index = getStoryIndexFromScroll();
    const metrics = storyMetrics || measureStory();
    if (!metrics) return;
    const targetY = Math.round(metrics.start + index * metrics.segment);
    if (Math.abs(window.scrollY - targetY) < 6) return;
    goToStoryIndex(index, duration);
  }

  function scheduleSnap() {
    window.clearTimeout(snapTimer);
    if (!guidedEnabled || autoScrolling || !storyContainsViewport()) return;
    snapTimer = window.setTimeout(() => {
      snapToNearestStoryPanel(560);
    }, 140);
  }

  function isFormField(element) {
    if (!(element instanceof Element)) return false;
    return Boolean(element.closest('input, textarea, select, option, button'));
  }

  function storyBoundaryDirection(direction) {
    const metrics = storyMetrics || measureStory();
    if (!metrics) return null;
    const progress = getStoryProgress();
    if (direction < 0 && progress <= 0.02) return 'start';
    if (direction > 0 && progress >= storyPanels.length - 1 - 0.02) return 'end';
    return null;
  }

  function handleStoryStep(direction) {
    const boundary = storyBoundaryDirection(direction);
    const index = getStoryIndexFromScroll();

    if (boundary === 'start' && direction < 0) return false;

    if (boundary === 'end' && direction > 0) {
      if (applySection) {
        scrollToSection('apply', 760);
        return true;
      }
      return false;
    }

    goToStoryIndex(index + direction, 760);
    return true;
  }

  function handleAnchorNavigation(event) {
    const link = event.currentTarget;
    if (!(link instanceof HTMLAnchorElement)) return;
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!(target instanceof HTMLElement)) return;

    event.preventDefault();
    closeNav();
    scrollToSection(id, 760);
  }

  anchorLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    link.addEventListener('click', handleAnchorNavigation);
  });

  window.addEventListener(
    'wheel',
    (event) => {
      if (!guidedEnabled) return;
      if (body.classList.contains('nav-open')) return;
      if (event.ctrlKey || event.metaKey) return;
      if (isFormField(event.target)) return;

      const deltaY = event.deltaY;
      if (Math.abs(deltaY) < 8) return;

      const applyTop = applySection ? applySection.getBoundingClientRect().top : null;
      const isOnApply = typeof applyTop === 'number' && applyTop <= window.innerHeight * 0.24;
      if (!storyContainsViewport() && !isOnApply) return;

      const direction = deltaY > 0 ? 1 : -1;

      if (!storyContainsViewport()) {
        if (direction < 0 && isOnApply && applySection && applySection.getBoundingClientRect().top >= headerHeight() - 6 && !autoScrolling) {
          event.preventDefault();
          goToStoryIndex(storyPanels.length - 1, 720);
        }
        return;
      }

      event.preventDefault();
      if (autoScrolling) return;

      wheelAccumulator += deltaY;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAccumulator = 0;
      }, 150);

      if (Math.abs(wheelAccumulator) < 42) return;
      const resolvedDirection = wheelAccumulator > 0 ? 1 : -1;
      wheelAccumulator = 0;
      handleStoryStep(resolvedDirection);
    },
    { passive: false }
  );

  window.addEventListener('keydown', (event) => {
    if (!guidedEnabled) return;
    if (body.classList.contains('nav-open')) return;

    const activeEl = document.activeElement;
    if (activeEl && /INPUT|TEXTAREA|SELECT/.test(activeEl.tagName)) return;

    const key = event.key;
    const isSpace = key === ' ' || key === 'Spacebar';

    if (storyContainsViewport()) {
      if (key === 'ArrowDown' || key === 'PageDown' || isSpace) {
        event.preventDefault();
        if (!autoScrolling) handleStoryStep(1);
        return;
      }
      if (key === 'ArrowUp' || key === 'PageUp') {
        event.preventDefault();
        if (!autoScrolling) handleStoryStep(-1);
        return;
      }
      if (key === 'Home') {
        event.preventDefault();
        goToStoryIndex(0, 720);
        return;
      }
      if (key === 'End') {
        event.preventDefault();
        scrollToSection('apply', 760);
      }
      return;
    }

    if (applySection && applySection.getBoundingClientRect().top <= window.innerHeight * 0.24 && key === 'ArrowUp') {
      event.preventDefault();
      if (!autoScrolling) goToStoryIndex(storyPanels.length - 1, 720);
    }
  });

  window.addEventListener('scroll', () => {
    onScrollHeader();
    if (guidedEnabled) {
      renderGuidedStory();
      scheduleSnap();
      return;
    }
    applyNonGuidedActiveSection();
  }, { passive: true });

  window.addEventListener('resize', () => {
    updateGuideMode();
    if (guidedEnabled) renderGuidedStory();
  });

  if (typeof guidedMedia.addEventListener === 'function') {
    guidedMedia.addEventListener('change', updateGuideMode);
    prefersReducedMotion.addEventListener('change', updateGuideMode);
  } else {
    guidedMedia.addListener(updateGuideMode);
    prefersReducedMotion.addListener(updateGuideMode);
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

  document.querySelectorAll('[data-track]').forEach((element) => {
    element.addEventListener('click', () => {
      const name = element.getAttribute('data-track');
      if (name) track(name);
    });
  });

  if (year) year.textContent = new Date().getFullYear();

  if (form) {
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
  }

  setupIntersectionObserver();
  updateGuideMode();
  onScrollHeader();

  if (window.location.hash) {
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    if (target instanceof HTMLElement) {
      window.setTimeout(() => {
        scrollToSection(id, 10);
      }, 60);
    }
  } else {
    setActivePanel(activePanelId);
  }
})();
