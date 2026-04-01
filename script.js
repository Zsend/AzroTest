
(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const scroller = document.getElementById('chapter-viewport');
  const navToggle = document.querySelector('.nav-toggle');
  const sections = scroller ? Array.from(scroller.querySelectorAll('[data-chapter]')) : [];
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const railNodes = Array.from(document.querySelectorAll('.flow-node'));
  const railStatus = document.getElementById('rail-status');
  const guideNote = document.querySelector('.guide-note');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasFinePointer = window.matchMedia('(pointer: fine)');
  const yearNode = document.getElementById('year');

  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  if (!scroller || !sections.length) {
    if (navToggle && header) {
      navToggle.addEventListener('click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', String(!expanded));
        header.classList.toggle('is-open', !expanded);
      });
    }
    return;
  }

  let guided = false;
  let activeIndex = 0;
  let locking = false;
  let wheelIntent = 0;
  let lastWheelTime = 0;
  let rafId = 0;
  let enterTimer = 0;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function normalizeDelta(delta, mode = 0) {
    if (mode === 1) return delta * 16;
    if (mode === 2) return delta * window.innerHeight;
    return delta;
  }

  function setHeaderVar() {
    const h = header ? header.offsetHeight : 84;
    root.style.setProperty('--header-h', `${h}px`);
  }

  function sectionTop(index) {
    const section = sections[index];
    return section ? Math.max(0, Math.round(section.offsetTop)) : 0;
  }

  function nearestIndex() {
    const anchor = scroller.scrollTop + ((header?.offsetHeight || 84) * 0.5);
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    sections.forEach((section, index) => {
      const dist = Math.abs(section.offsetTop - anchor);
      if (dist < bestDist) {
        best = index;
        bestDist = dist;
      }
    });
    return best;
  }

  function pulseEnter(index) {
    clearTimeout(enterTimer);
    sections.forEach(section => section.classList.remove('is-entering'));
    const section = sections[index];
    if (!section || !guided) return;
    void section.offsetWidth;
    section.classList.add('is-entering');
    enterTimer = window.setTimeout(() => {
      section.classList.remove('is-entering');
    }, 980);
  }

  function setActive(index, { pulse = false } = {}) {
    activeIndex = clamp(index, 0, sections.length - 1);
    const section = sections[activeIndex];
    if (!section) return;

    body.dataset.chapter = section.id;
    sections.forEach((panel, idx) => panel.classList.toggle('is-active', idx === activeIndex));
    navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${section.id}`));
    railNodes.forEach(node => node.classList.toggle('is-active', node.getAttribute('href') === `#${section.id}`));

    const progress = sections.length > 1 ? activeIndex / (sections.length - 1) : 0;
    const progressPct = `${(((activeIndex + 1) / sections.length) * 100).toFixed(3)}%`;
    root.style.setProperty('--chapter-progress', progress.toFixed(4));
    root.style.setProperty('--chapter-progress-pct', progressPct);

    if (railStatus) {
      const title = section.dataset.railTitle || section.querySelector('h2, h1')?.textContent || section.id;
      const shortTitle = title.length > 28 ? `${title.slice(0, 28).trim()}…` : title;
      railStatus.innerHTML = `<strong>${String(activeIndex + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}</strong> ${shortTitle}`;
    }

    if (pulse) pulseEnter(activeIndex);
  }

  function setGuideNote() {
    if (!guideNote) return;
    guideNote.innerHTML = guided
      ? '<strong>Chapter lock active.</strong> One scroll auto-advances and stops on the next section.'
      : 'Free scroll on this screen. Chapter lock turns on automatically when every section fits cleanly.';
  }

  function animateScrollTo(targetTop, { duration = 760, instant = false } = {}) {
    cancelAnimationFrame(rafId);

    if (instant || reduceMotion.matches) {
      scroller.scrollTop = targetTop;
      locking = false;
      body.classList.remove('is-transitioning');
      return Promise.resolve();
    }

    locking = true;
    body.classList.add('is-transitioning');

    const start = scroller.scrollTop;
    const diff = targetTop - start;
    const startTime = performance.now();

    return new Promise(resolve => {
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        scroller.scrollTop = Math.round(start + diff * eased);

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          locking = false;
          body.classList.remove('is-transitioning');
          resolve();
        }
      }
      rafId = requestAnimationFrame(step);
    });
  }

  function goToIndex(index, opts = {}) {
    const next = clamp(index, 0, sections.length - 1);
    const target = sectionTop(next);
    setActive(next, { pulse: !opts.instant });
    wheelIntent = 0;
    return animateScrollTo(target, opts).then(() => {
      setActive(next);
      if (opts.updateHash !== false) {
        history.replaceState(null, '', `#${sections[next].id}`);
      }
    });
  }

  function step(direction) {
    if (locking) return;
    const current = guided ? activeIndex : nearestIndex();
    const next = clamp(current + direction, 0, sections.length - 1);
    if (next === current) return;
    goToIndex(next);
  }

  function shouldIgnoreTarget(target) {
    return !!target.closest('input, textarea, select, option, label, button:not(.nav-toggle), [contenteditable="true"]');
  }

  function chaptersFitGuided() {
    if (window.innerWidth < 1180) return false;
    if (window.innerHeight < 760) return false;
    if (!hasFinePointer.matches) return false;
    if (reduceMotion.matches) return false;

    body.classList.add('guidance-measure');
    setHeaderVar();

    const viewportHeight = scroller.clientHeight || window.innerHeight;
    const fits = sections.every(section => {
      const inner = section.querySelector('.chapter-inner');
      if (!inner) return true;
      const style = window.getComputedStyle(section);
      const padTop = parseFloat(style.paddingTop) || 0;
      const padBottom = parseFloat(style.paddingBottom) || 0;
      return inner.scrollHeight + padTop + padBottom <= viewportHeight + 4;
    });

    body.classList.remove('guidance-measure');
    return fits;
  }

  function syncGuidedMode({ preservePosition = true } = {}) {
    const previousGuided = guided;
    const currentIndex = nearestIndex();
    guided = chaptersFitGuided();
    body.classList.toggle('guided-mode', guided);
    setHeaderVar();
    setActive(currentIndex);
    setGuideNote();

    if (guided && (!previousGuided || !preservePosition)) {
      goToIndex(currentIndex, { instant: true, updateHash: false });
    }
  }

  function onWheel(event) {
    if (!guided) return;
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey) return;
    if (shouldIgnoreTarget(event.target)) return;

    const deltaX = normalizeDelta(event.deltaX, event.deltaMode);
    const deltaY = normalizeDelta(event.deltaY, event.deltaMode);

    if (Math.abs(deltaY) <= Math.abs(deltaX)) return;
    if (Math.abs(deltaY) < 1) return;

    event.preventDefault();

    if (locking) return;

    const now = performance.now();
    if (now - lastWheelTime > 160) {
      wheelIntent = 0;
    }
    lastWheelTime = now;

    if (wheelIntent !== 0 && Math.sign(deltaY) !== Math.sign(wheelIntent)) {
      wheelIntent = 0;
    }

    wheelIntent += deltaY;

    if (Math.abs(wheelIntent) < 30) return;

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
        goToIndex(0);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        goToIndex(sections.length - 1);
        return;
      }
      return;
    }

    const pageJump = Math.round((scroller.clientHeight || window.innerHeight) * 0.88);
    const maxScroll = scroller.scrollHeight - scroller.clientHeight;

    if (event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      animateScrollTo(clamp(scroller.scrollTop + pageJump, 0, maxScroll), { duration: 520 });
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      animateScrollTo(clamp(scroller.scrollTop - pageJump, 0, maxScroll), { duration: 520 });
    } else if (event.key === 'Home') {
      event.preventDefault();
      goToIndex(0, { instant: false });
    } else if (event.key === 'End') {
      event.preventDefault();
      goToIndex(sections.length - 1, { instant: false });
    }
  }

  function onScroll() {
    header?.classList.toggle('is-scrolled', scroller.scrollTop > 8);
    if (!locking) {
      const nearest = nearestIndex();
      if (nearest !== activeIndex) setActive(nearest);
    }
  }

  function handleHashNavigation(hashValue, { instant = true } = {}) {
    if (!hashValue) return;
    const id = hashValue.replace(/^#/, '');
    const index = sections.findIndex(section => section.id === id);
    if (index < 0) return;
    goToIndex(index, { instant, updateHash: false });
  }

  navLinks.concat(railNodes).forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const id = href.slice(1);
      const index = sections.findIndex(section => section.id === id);
      if (index < 0) return;

      event.preventDefault();
      goToIndex(index);
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

  const form = document.getElementById('application-form');
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
      const horizon = String(data.get('horizon') || '').trim();
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
Time horizon: ${horizon || 'Not provided'}

What the reserve should do:
${goal || 'Not provided'}

Sent from the Reserve Standard website.`);
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${bodyCopy}`;
    });
  }

  function init() {
    setHeaderVar();
    setActive(nearestIndex());
    syncGuidedMode({ preservePosition: false });
    handleHashNavigation(window.location.hash, { instant: true });
    onScroll();
  }

  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  window.addEventListener('keydown', onKeyDown);
  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => syncGuidedMode());
  window.addEventListener('hashchange', () => handleHashNavigation(window.location.hash, { instant: true }));
  window.addEventListener('load', init);
  document.addEventListener('DOMContentLoaded', init);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      syncGuidedMode();
      onScroll();
    }).catch(() => {});
  }
})();
