(function () {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const footer = document.querySelector('.site-footer');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const year = document.getElementById('year');
  const form = document.getElementById('application-form');

  const panels = Array.from(document.querySelectorAll('.snap-panel[id]'));
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
  const flowLinks = Array.from(document.querySelectorAll('.flow-node[href^="#"]'));
  const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
  const flowStatus = document.querySelector('.flow-rail__status');
  const flowTrack = document.querySelector('.flow-rail__track');
  const flowBeam = document.querySelector('.flow-rail__beam');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopGuideMedia = window.matchMedia('(min-width: 1281px) and (pointer: fine)');

  let guidedEnabled = false;
  let activePanelId = panels[0]?.id || 'home';
  let autoScrolling = false;
  let autoScrollTimer = null;
  let wheelAccumulator = 0;
  let wheelResetTimer = null;
  let wheelCooldownUntil = 0;

  function bindMedia(mediaQuery, handler) {
    if (!mediaQuery) return;
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handler);
    }
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
      if (!(target instanceof Element)) return;
      if (!header?.classList.contains('nav-open')) return;
      if (header.contains(target)) return;
      closeNav();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
  }

  function onScroll() {
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  function getPanelIndexById(id) {
    return panels.findIndex((panel) => panel.id === id);
  }

  function updateFlowBeam() {
    if (!flowTrack || !flowBeam || !flowLinks.length) return;
    const activeLink = flowLinks.find((link) => link.classList.contains('is-current')) || flowLinks[0];
    if (!(activeLink instanceof HTMLElement)) return;

    const trackRect = flowTrack.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const targetY = linkRect.top + linkRect.height * 0.5 - trackRect.top - flowBeam.offsetHeight * 0.5;
    flowTrack.style.setProperty('--beam-y', `${Math.max(0, targetY)}px`);
    flowBeam.style.setProperty('--beam-y', `${Math.max(0, targetY)}px`);
  }

  function setActivePanel(id) {
    if (!id) return;
    activePanelId = id;
    body.dataset.panel = id;

    panels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.id === id);
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const isMatch = href === `#${id}` || (id === 'home' && href === '#home');
      link.classList.toggle('is-active', isMatch);
      if (isMatch) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    flowLinks.forEach((link) => {
      const href = link.getAttribute('href');
      const isMatch = href === `#${id}`;
      link.classList.toggle('is-current', isMatch);
      if (isMatch && flowStatus) {
        const index = getPanelIndexById(id);
        const title = link.querySelector('.flow-node__title')?.textContent?.trim() || 'Chapter';
        flowStatus.textContent = `Chapter ${String(index + 1).padStart(2, '0')} · ${title}`;
      }
    });

    updateFlowBeam();
  }

  function updateGuideMode() {
    guidedEnabled = desktopGuideMedia.matches && !prefersReducedMotion.matches;
    root.classList.toggle('is-guided', guidedEnabled);
    setActivePanel(activePanelId);
  }

  function getNearestPanelIndex() {
    const viewportMid = window.scrollY + window.innerHeight * 0.5;
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

  function finishAutoScroll(delay) {
    window.clearTimeout(autoScrollTimer);
    autoScrollTimer = window.setTimeout(() => {
      autoScrolling = false;
      updateFlowBeam();
    }, delay);
  }

  function getScrollTargetY(target) {
    if (!(target instanceof HTMLElement)) return 0;
    const headerOffset = header?.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    return Math.max(0, Math.round(top));
  }

  function scrollToPanel(target, behavior = 'smooth') {
    if (!(target instanceof HTMLElement)) return;
    autoScrolling = true;
    window.scrollTo({ top: getScrollTargetY(target), behavior });
    setActivePanel(target.id);
    finishAutoScroll(760);
  }

  function goRelative(direction) {
    const currentIndex = getActivePanelIndex();
    const nextIndex = Math.min(panels.length - 1, Math.max(0, currentIndex + direction));
    if (nextIndex === currentIndex) {
      autoScrolling = false;
      return;
    }
    scrollToPanel(panels[nextIndex]);
  }

  function isFocusableFormElement(element) {
    if (!(element instanceof Element)) return false;
    return Boolean(element.closest('input, textarea, select, option, button'));
  }

  function allowNativeEdgeScroll(direction) {
    const currentIndex = getActivePanelIndex();
    if (direction < 0 && currentIndex === 0 && window.scrollY <= 2) return true;

    if (direction > 0 && currentIndex === panels.length - 1) {
      const lastPanel = panels[currentIndex];
      const threshold = lastPanel.offsetTop + 8;
      if (window.scrollY >= threshold) return true;
    }

    if (footer && footer.getBoundingClientRect().top < window.innerHeight && direction < 0) {
      return true;
    }

    return false;
  }

  function handleWheel(event) {
    if (!guidedEnabled) return;
    if (body.classList.contains('nav-open')) return;
    if (event.ctrlKey || event.metaKey) return;
    if (isFocusableFormElement(event.target)) return;

    const deltaY = event.deltaY;
    if (Math.abs(deltaY) < 10) return;

    const direction = deltaY > 0 ? 1 : -1;
    if (allowNativeEdgeScroll(direction)) return;

    event.preventDefault();

    if (autoScrolling || Date.now() < wheelCooldownUntil) return;

    wheelAccumulator += deltaY;
    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => {
      wheelAccumulator = 0;
    }, 140);

    if (Math.abs(wheelAccumulator) < 44) return;

    const resolvedDirection = wheelAccumulator > 0 ? 1 : -1;
    wheelAccumulator = 0;
    wheelCooldownUntil = Date.now() + 820;
    goRelative(resolvedDirection);
  }

  function handleKeydown(event) {
    if (!guidedEnabled) return;
    if (body.classList.contains('nav-open')) return;

    const activeEl = document.activeElement;
    if (activeEl && /INPUT|TEXTAREA|SELECT/.test(activeEl.tagName)) return;

    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      if (allowNativeEdgeScroll(1)) return;
      event.preventDefault();
      goRelative(1);
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      if (allowNativeEdgeScroll(-1)) return;
      event.preventDefault();
      goRelative(-1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      scrollToPanel(panels[0]);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      scrollToPanel(panels[panels.length - 1]);
    }
  }

  function handleAnchorNavigation(event) {
    const link = event.currentTarget;
    if (!(link instanceof HTMLAnchorElement)) return;
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    const target = document.querySelector(href);
    if (!(target instanceof HTMLElement)) return;

    event.preventDefault();
    closeNav();
    scrollToPanel(target, 'smooth');
  }

  function updateActiveFromViewport() {
    const viewportMid = window.scrollY + window.innerHeight * 0.5;
    let next = panels[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    panels.forEach((panel) => {
      const panelMid = panel.offsetTop + panel.offsetHeight * 0.5;
      const distance = Math.abs(panelMid - viewportMid);
      if (distance < closestDistance) {
        closestDistance = distance;
        next = panel;
      }
    });

    if (next) setActivePanel(next.id);
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

  function initRevealItems() {
    const revealTargets = Array.from(
      document.querySelectorAll(
        '.signal-chip, .job-card, .default-card, .fail-card, .step-card, .proof-card, .fit-card, .qa-card, .showcase-card, .apply-card, .program-panel__copy, .proof-visual, .application-form, .apply-copy'
      )
    );

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) return;

    revealTargets.forEach((el) => el.classList.add('reveal-item'));

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.18 }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  function initForm() {
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
      if (status) {
        status.textContent = 'Your email app should open with a pre-filled application. If nothing happens, email support@azrosystems.com directly.';
      }
      track('submit_application');
    });
  }

  function initTrackers() {
    document.querySelectorAll('[data-track]').forEach((el) => {
      el.addEventListener('click', () => {
        const name = el.getAttribute('data-track');
        if (name) track(name);
      });
    });
  }

  function init() {
    if (year) year.textContent = new Date().getFullYear();
    onScroll();
    updateGuideMode();
    setActivePanel(activePanelId);
    initRevealItems();
    initForm();
    initTrackers();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', updateActiveFromViewport, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', updateFlowBeam);

    bindMedia(prefersReducedMotion, updateGuideMode);
    bindMedia(desktopGuideMedia, updateGuideMode);

    anchorLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      link.addEventListener('click', handleAnchorNavigation);
    });

    if ('IntersectionObserver' in window && panels.length) {
      const panelObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible || !(visible.target instanceof HTMLElement)) return;
          setActivePanel(visible.target.id);
        },
        { rootMargin: '-28% 0px -28% 0px', threshold: [0.24, 0.45, 0.62, 0.78] }
      );

      panels.forEach((panel) => panelObserver.observe(panel));
    }

    window.addEventListener('load', () => {
      if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target instanceof HTMLElement) {
          window.scrollTo({ top: getScrollTargetY(target), behavior: 'auto' });
          setActivePanel(target.id);
        }
      } else {
        setActivePanel(activePanelId);
      }
      updateFlowBeam();
    });
  }

  init();
})();
