
(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const sections = Array.from(document.querySelectorAll('[data-chapter]'));
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const railNodes = Array.from(document.querySelectorAll('.flow-node'));
  const railStatus = document.getElementById('rail-status');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const guidedQuery = window.matchMedia('(min-width: 1181px) and (pointer: fine)');
  let guided = false;
  let activeIndex = 0;
  let locking = false;
  let momentumLockUntil = 0;
  let rafId = 0;

  function setHeaderVar() {
    const h = header ? header.offsetHeight : 84;
    root.style.setProperty('--header-h', `${h}px`);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function sectionTop(section) {
    return Math.max(0, Math.round(section.offsetTop));
  }

  function getNearestIndex() {
    const anchor = window.scrollY + ((header?.offsetHeight || 84) * 0.5);
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

  function setActive(index) {
    activeIndex = clamp(index, 0, sections.length - 1);
    const section = sections[activeIndex];
    if (!section) return;

    body.dataset.chapter = section.id;
    sections.forEach((panel, idx) => panel.classList.toggle('is-active', idx === activeIndex));
    navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${section.id}`));
    railNodes.forEach(node => node.classList.toggle('is-active', node.getAttribute('href') === `#${section.id}`));

    const progress = sections.length > 1 ? activeIndex / (sections.length - 1) : 0;
    root.style.setProperty('--chapter-progress', progress.toFixed(4));
    if (railStatus) {
      const title = section.dataset.railTitle || section.querySelector('h2, h1')?.textContent || section.id;
      const shortTitle = title.length > 22 ? title.slice(0, 22).trim() + '…' : title;
      railStatus.innerHTML = `<strong>${String(activeIndex + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}</strong> ${shortTitle}`;
    }
  }

  function animateTo(targetTop, { duration = 760, instant = false } = {}) {
    cancelAnimationFrame(rafId);
    if (instant || reduceMotion.matches) {
      window.scrollTo(0, targetTop);
      return Promise.resolve();
    }
    locking = true;
    const start = window.scrollY;
    const diff = targetTop - start;
    const startTime = performance.now();

    return new Promise(resolve => {
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, Math.round(start + diff * eased));
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          locking = false;
          resolve();
        }
      }
      rafId = requestAnimationFrame(step);
    });
  }

  function goToIndex(index, opts = {}) {
    const next = clamp(index, 0, sections.length - 1);
    setActive(next);
    momentumLockUntil = performance.now() + (opts.instant ? 0 : 950);
    return animateTo(sectionTop(sections[next]), opts).then(() => {
      setActive(next);
      if (opts.updateHash !== false) {
        history.replaceState(null, '', `#${sections[next].id}`);
      }
    });
  }

  function stepTo(direction) {
    const current = getNearestIndex();
    const next = clamp(current + direction, 0, sections.length - 1);
    if (next === current) return;
    goToIndex(next);
  }

  function shouldIgnoreTarget(target) {
    return !!target.closest('input, textarea, select, option, label, button:not(.nav-toggle), [contenteditable="true"]');
  }

  function isGuided() {
    return guidedQuery.matches && !reduceMotion.matches;
  }

  function syncGuidedMode() {
    guided = isGuided();
    body.classList.toggle('guided-mode', guided);
    setHeaderVar();
    setActive(getNearestIndex());
    if (guided) {
      goToIndex(getNearestIndex(), { instant: true, updateHash: false });
    }
  }

  function onWheel(event) {
    if (!guided) return;
    if (event.ctrlKey || event.metaKey) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if (shouldIgnoreTarget(event.target)) return;
    if (Math.abs(event.deltaY) < 3) return;

    event.preventDefault();

    const now = performance.now();
    if (locking || now < momentumLockUntil) return;

    stepTo(event.deltaY > 0 ? 1 : -1);
  }

  function onKeyDown(event) {
    const target = event.target;
    if (shouldIgnoreTarget(target)) return;

    if (guided) {
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        if (!locking && performance.now() >= momentumLockUntil) stepTo(1);
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        if (!locking && performance.now() >= momentumLockUntil) stepTo(-1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        if (!locking && performance.now() >= momentumLockUntil) goToIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        if (!locking && performance.now() >= momentumLockUntil) goToIndex(sections.length - 1);
      }
    }
  }

  function onScroll() {
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
    if (!locking) setActive(getNearestIndex());
  }

  function handleHashNavigation(hashValue) {
    if (!hashValue) return;
    const id = hashValue.replace(/^#/, '');
    const index = sections.findIndex(section => section.id === id);
    if (index >= 0) {
      if (guided) {
        goToIndex(index, { instant: true, updateHash: false });
      } else {
        window.scrollTo({ top: sectionTop(sections[index]), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
      setActive(index);
    }
  }

  navLinks.concat(railNodes).forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const id = href.slice(1);
      const index = sections.findIndex(section => section.id === id);
      if (index < 0) return;
      event.preventDefault();
      if (guided) {
        goToIndex(index);
      } else {
        history.replaceState(null, '', `#${sections[index].id}`);
        window.scrollTo({ top: sectionTop(sections[index]), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
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
      const body = encodeURIComponent(
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
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    });
  }

  const yearNode = document.getElementById('year');
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', syncGuidedMode);
  window.addEventListener('load', () => {
    setHeaderVar();
    syncGuidedMode();
    handleHashNavigation(window.location.hash);
  });
  document.addEventListener('DOMContentLoaded', () => {
    setHeaderVar();
    syncGuidedMode();
    handleHashNavigation(window.location.hash);
  });
})();
