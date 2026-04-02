(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const shell = document.getElementById('story-shell');
  const track = document.getElementById('story-track');
  const sections = Array.from(document.querySelectorAll('.chapter[data-chapter]'));
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const railNodes = Array.from(document.querySelectorAll('.flow-node'));
  const railStatus = document.getElementById('rail-status');
  const form = document.getElementById('application-form');
  const yearNode = document.getElementById('year');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const guidedQuery = window.matchMedia('(min-width: 1120px) and (min-height: 740px) and (pointer: fine)');

  const TRANSITION_MS = 920;
  const WHEEL_THRESHOLD = 34;
  let guided = false;
  let activeIndex = 0;
  let locking = false;
  let wheelIntent = 0;
  let wheelResetTimer = 0;
  let unlockTimer = 0;
  let initialized = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setFrameVars() {
    const headerH = header ? header.offsetHeight : 84;
    root.style.setProperty('--header-h', `${headerH}px`);
    root.style.setProperty('--story-h', `${Math.max(320, window.innerHeight - headerH)}px`);
  }

  function currentSection() {
    return sections[activeIndex] || sections[0] || null;
  }

  function sectionTop(section) {
    return section ? Math.max(0, Math.round(section.offsetTop)) : 0;
  }

  function nearestScrollIndex() {
    const anchor = window.scrollY + (window.innerHeight * 0.35);
    let nearest = 0;
    let nearestDist = Number.POSITIVE_INFINITY;

    sections.forEach((section, index) => {
      const dist = Math.abs(section.offsetTop - anchor);
      if (dist < nearestDist) {
        nearest = index;
        nearestDist = dist;
      }
    });

    return nearest;
  }

  function setActive(index, { updateHash = false } = {}) {
    activeIndex = clamp(index, 0, sections.length - 1);
    const section = currentSection();
    if (!section) return;

    body.dataset.chapter = section.id;
    sections.forEach((node, idx) => node.classList.toggle('is-active', idx === activeIndex));
    navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${section.id}`));
    railNodes.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${section.id}`));

    const progress = sections.length > 1 ? activeIndex / (sections.length - 1) : 0;
    root.style.setProperty('--chapter-progress', progress.toFixed(4));

    if (railStatus) {
      const railTitle = section.dataset.railTitle || section.querySelector('h1, h2')?.textContent || section.id;
      railStatus.innerHTML = `<strong>${String(activeIndex + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}</strong>${railTitle}`;
    }

    if (updateHash) {
      history.replaceState(null, '', `#${section.id}`);
    }
  }

  function stopTransitionLock() {
    locking = false;
    body.classList.remove('is-transitioning');
    clearTimeout(unlockTimer);
  }

  function applyGuidedTransform({ instant = false } = {}) {
    if (!guided || !track || !shell) return;

    const offset = -(shell.clientHeight * activeIndex);

    if (instant || reduceMotion.matches) {
      const previous = track.style.transition;
      track.style.transition = 'none';
      track.style.transform = `translate3d(0, ${offset}px, 0)`;
      track.getBoundingClientRect();
      track.style.transition = previous;
      stopTransitionLock();
      return;
    }

    body.classList.add('is-transitioning');
    locking = true;
    track.style.transform = `translate3d(0, ${offset}px, 0)`;
    unlockTimer = window.setTimeout(stopTransitionLock, TRANSITION_MS + 120);
  }

  function scrollToSection(index, { instant = false, updateHash = true } = {}) {
    const nextIndex = clamp(index, 0, sections.length - 1);
    const section = sections[nextIndex];
    if (!section) return;

    setActive(nextIndex, { updateHash });

    if (guided) {
      applyGuidedTransform({ instant });
      return;
    }

    const top = sectionTop(section);
    if (instant || reduceMotion.matches) {
      window.scrollTo(0, top);
    } else {
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  function step(direction) {
    if (locking) return;
    const nextIndex = clamp(activeIndex + direction, 0, sections.length - 1);
    if (nextIndex === activeIndex) return;
    scrollToSection(nextIndex, { instant: false, updateHash: true });
  }

  function shouldIgnoreTarget(target) {
    return !!target.closest('input, textarea, select, option, label, button:not(.nav-toggle), [contenteditable="true"]');
  }

  function normalizeDelta(delta, mode = 0) {
    if (mode === 1) return delta * 16;
    if (mode === 2) return delta * window.innerHeight;
    return delta;
  }

  function onWheel(event) {
    if (!guided) return;
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey) return;
    if (shouldIgnoreTarget(event.target)) return;

    const deltaX = normalizeDelta(event.deltaX, event.deltaMode);
    const deltaY = normalizeDelta(event.deltaY, event.deltaMode);

    if (Math.abs(deltaY) <= Math.abs(deltaX)) return;
    if (Math.abs(deltaY) < 2) return;

    event.preventDefault();
    event.stopPropagation();

    if (locking) return;

    if (wheelIntent !== 0 && Math.sign(deltaY) !== Math.sign(wheelIntent)) {
      wheelIntent = 0;
    }

    wheelIntent += deltaY;
    clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => {
      wheelIntent = 0;
    }, 140);

    if (Math.abs(wheelIntent) < WHEEL_THRESHOLD) return;

    const direction = wheelIntent > 0 ? 1 : -1;
    wheelIntent = 0;
    step(direction);
  }

  function onKeyDown(event) {
    if (shouldIgnoreTarget(event.target)) return;

    if (guided) {
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        step(1);
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        step(-1);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        scrollToSection(0, { instant: false, updateHash: true });
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        scrollToSection(sections.length - 1, { instant: false, updateHash: true });
        return;
      }
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      scrollToSection(0, { instant: false, updateHash: true });
    } else if (event.key === 'End') {
      event.preventDefault();
      scrollToSection(sections.length - 1, { instant: false, updateHash: true });
    }
  }

  function onScroll() {
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
    if (!guided && !locking) {
      const nearest = nearestScrollIndex();
      if (nearest !== activeIndex) setActive(nearest, { updateHash: false });
    }
  }

  function syncGuidedMode({ preserve = true } = {}) {
    const nextGuided = guidedQuery.matches && !reduceMotion.matches;
    setFrameVars();

    if (nextGuided === guided) {
      if (guided) {
        applyGuidedTransform({ instant: true });
      } else {
        setActive(nearestScrollIndex(), { updateHash: false });
      }
      return;
    }

    if (nextGuided) {
      const nextIndex = preserve ? nearestScrollIndex() : activeIndex;
      guided = true;
      body.classList.add('guided-mode');
      setActive(nextIndex, { updateHash: false });
      window.scrollTo(0, 0);
      requestAnimationFrame(() => applyGuidedTransform({ instant: true }));
    } else {
      guided = false;
      body.classList.remove('guided-mode');
      stopTransitionLock();
      if (track) {
        track.style.transform = 'none';
      }
      setActive(activeIndex, { updateHash: false });
      requestAnimationFrame(() => {
        const section = currentSection();
        if (section) window.scrollTo(0, sectionTop(section));
      });
    }
  }

  function handleHashNavigation(hashValue, { instant = true } = {}) {
    if (!hashValue) return;
    const id = hashValue.replace(/^#/, '');
    const index = sections.findIndex(section => section.id === id);
    if (index < 0) return;
    scrollToSection(index, { instant, updateHash: false });
  }

  navLinks.concat(railNodes).forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const id = href.slice(1);
      const index = sections.findIndex(section => section.id === id);
      if (index < 0) return;

      event.preventDefault();
      scrollToSection(index, { instant: false, updateHash: true });
      header?.classList.remove('is-open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      header?.classList.toggle('is-open', !expanded);
    });
  }

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const contactEmail = form.dataset.contactEmail || '';
      const name = String(data.get('name') || '').trim();
      const business = String(data.get('business') || '').trim();
      const email = String(data.get('email') || '').trim();
      const cashflow = String(data.get('cashflow') || '').trim();
      const buffer = String(data.get('buffer') || '').trim();
      const goal = String(data.get('goal') || '').trim();

      if (!name || !business || !email) {
        const firstMissing = form.querySelector('input[required]:invalid');
        firstMissing?.focus();
        return;
      }

      const subject = encodeURIComponent(`Reserve review — ${business}`);
      const bodyCopy = encodeURIComponent(
`Reserve Review Request

Name: ${name}
Business: ${business}
Email: ${email}
Cash flow profile: ${cashflow || 'Not provided'}
Current cash buffer: ${buffer || 'Not provided'}

What the reserve should do:
${goal || 'Not provided'}

Sent from the Reserve Standard website.`);
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${bodyCopy}`;
    });
  }

  function init() {
    if (initialized) return;
    initialized = true;
    if (yearNode) yearNode.textContent = String(new Date().getFullYear());
    setFrameVars();
    setActive(0, { updateHash: false });
    syncGuidedMode({ preserve: false });
    handleHashNavigation(window.location.hash, { instant: true });
    onScroll();
  }

  track?.addEventListener('transitionend', event => {
    if (event.propertyName === 'transform') {
      stopTransitionLock();
    }
  });

  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => syncGuidedMode());
  window.addEventListener('hashchange', () => handleHashNavigation(window.location.hash, { instant: true }));
  window.addEventListener('load', init, { once: true });
  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
