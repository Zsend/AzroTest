/*
  AZRO Systems — site interactions
  - Link hydration from config.js
  - Mobile nav toggle
  - Auto-year
  - Accordions (single-open)
  - Free trial modal
  - Video modal
*/

(function () {
  const CONFIG = window.AZRO_CONFIG || {};
  const LINKS = (CONFIG && CONFIG.links) ? CONFIG.links : {};

  // --- Link hydration (single source of truth) ---
  document.querySelectorAll('a[data-link]').forEach((a) => {
    const key = a.getAttribute('data-link');
    if (!key) return;
    const href = LINKS[key];
    if (href && typeof href === 'string') {
      a.setAttribute('href', href);
      if (/^https?:\/\//i.test(href)) {
        a.setAttribute('rel', 'noopener noreferrer');
        if (a.hasAttribute('data-external')) a.setAttribute('target', '_blank');
      }
    }
  });

  // --- Footer year ---
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // --- Mobile nav ---
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  function closeNav() {
    if (!header || !navToggle) return;
    header.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }

  function openNav() {
    if (!header || !navToggle) return;
    header.classList.add('nav-open');
    document.body.classList.add('nav-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
  }

  if (navToggle && header) {
    navToggle.addEventListener('click', () => {
      const isOpen = header.classList.contains('nav-open');
      if (isOpen) closeNav();
      else openNav();
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!header.classList.contains('nav-open')) return;
      const target = e.target;
      if (!target) return;
      const clickedInsideNav = nav && nav.contains(target);
      const clickedToggle = navToggle.contains(target);
      if (!clickedInsideNav && !clickedToggle) closeNav();
    });

    // Close after clicking a nav link
    if (nav) {
      nav.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => closeNav());
      });
    }
  }

  // --- Accordions: allow only one open per group ---
  document.querySelectorAll('details[data-accordion]').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      const group = details.getAttribute('data-accordion');
      if (!group) return;
      document
        .querySelectorAll(`details[data-accordion="${group}"]`)
        .forEach((other) => {
          if (other !== details) other.open = false;
        });
    });
  });

  // --- Free trial modal ---
  const trialModal = document.getElementById('trialModal');
  const trialOpenButtons = document.querySelectorAll('[data-open-trial]');
  const trialCloseButtons = trialModal ? trialModal.querySelectorAll('[data-close-modal]') : [];

  function openTrialModal() {
    if (!trialModal) return;
    trialModal.classList.add('is-open');
    trialModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    closeNav();
  }

  function closeTrialModal() {
    if (!trialModal) return;
    trialModal.classList.remove('is-open');
    trialModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  trialOpenButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openTrialModal();
    });
  });

  if (trialModal) {
    trialModal.addEventListener('click', (e) => {
      if (e.target === trialModal) closeTrialModal();
    });
  }

  Array.from(trialCloseButtons).forEach((btn) => {
    btn.addEventListener('click', () => closeTrialModal());
  });

  // --- Video modal ---
  const videoModal = document.getElementById('videoModal');
  const videoEl = videoModal ? videoModal.querySelector('video') : null;
  const videoSource = videoEl ? videoEl.querySelector('source') : null;
  const videoCloseButtons = videoModal ? videoModal.querySelectorAll('[data-close-modal]') : [];

  function openVideoModal(src, startSeconds) {
    if (!videoModal || !videoEl || !videoSource) return;

    videoEl.pause();
    videoEl.currentTime = 0;

    videoSource.setAttribute('src', src);
    videoEl.load();

    const start = Number.isFinite(startSeconds) ? startSeconds : 0;

    const onLoaded = () => {
      try {
        if (start > 0 && videoEl.duration && start < videoEl.duration) {
          videoEl.currentTime = start;
        }
      } catch (_) {}

      // Muted autoplay is more reliable, but the videos are silent.
      videoEl.muted = true;
      videoEl.play().catch(() => {});
    };

    videoEl.addEventListener('loadedmetadata', onLoaded, { once: true });

    videoModal.classList.add('is-open');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    closeNav();
  }

  function closeVideoModal() {
    if (!videoModal || !videoEl || !videoSource) return;
    videoEl.pause();
    videoSource.setAttribute('src', '');
    videoEl.load();

    videoModal.classList.remove('is-open');
    videoModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('[data-video]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const src = btn.getAttribute('data-video');
      if (!src) return;
      const start = parseFloat(btn.getAttribute('data-start') || '0');
      openVideoModal(src, Number.isFinite(start) ? start : 0);
    });
  });

  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) closeVideoModal();
    });
  }

  Array.from(videoCloseButtons).forEach((btn) => {
    btn.addEventListener('click', () => closeVideoModal());
  });

  // Global escape handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTrialModal();
      closeVideoModal();
      closeNav();
    }
  });
})();
