/* AZRO Systems — site JS
   - Mobile nav toggle
   - Free trial modal (optional)
*/

(function () {
  // -----------------------------
  // Mobile nav
  // -----------------------------
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  if (header && toggle && nav) {
    const setOpen = (open) => {
      header.classList.toggle('nav-open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => {
      const open = !header.classList.contains('nav-open');
      setOpen(open);
    });

    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    document.addEventListener('click', (e) => {
      if (!header.classList.contains('nav-open')) return;
      if (header.contains(e.target)) return;
      setOpen(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) setOpen(false);
    });
  }



  // -----------------------------
  // Sticky CTA: keep content above the fixed bar on mobile
  // -----------------------------
  const sticky = document.querySelector('.sticky-cta');
  const updateSticky = () => {
    if (!sticky) return;
    const h = Math.ceil(sticky.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--sticky-h', `${h}px`);
  };
  updateSticky();
  window.addEventListener('resize', updateSticky, { passive: true });

  // -----------------------------
  // Free trial modal
  // -----------------------------
  const trialModal = document.getElementById('trialModal');
  if (!trialModal) return;

  const openers = document.querySelectorAll('[data-trial-open]');
  const closers = trialModal.querySelectorAll('[data-modal-close]');
  const closeBtn = trialModal.querySelector('.modal__close');
  const copyBtn = trialModal.querySelector('[data-copy-code]');
  const codeEl = trialModal.querySelector('#trialCode');

  const openModal = () => {
    trialModal.classList.add('is-open');
    trialModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Focus close button for keyboard users
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = () => {
    trialModal.classList.remove('is-open');
    trialModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (copyBtn) copyBtn.textContent = 'Copy';
  };

  openers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  closers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && trialModal.classList.contains('is-open')) {
      closeModal();
    }
  });

  if (copyBtn && codeEl) {
    copyBtn.addEventListener('click', async () => {
      const code = (codeEl.textContent || '').trim();
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code);
        copyBtn.textContent = 'Copied';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1600);
      } catch (err) {
        // Fallback
        const range = document.createRange();
        range.selectNodeContents(codeEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try {
          document.execCommand('copy');
          copyBtn.textContent = 'Copied';
          setTimeout(() => (copyBtn.textContent = 'Copy'), 1600);
        } finally {
          sel.removeAllRanges();
        }
      }
    });
  }
})();


/* Cursor-reactive glow for primary CTAs (desktop pointers) */
(() => {
  const btns = Array.from(document.querySelectorAll('.btn--primary[data-glow]'));
  if (!btns.length) return;

  const finePointer =
    window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (!finePointer) return;

  // Glow tuning: lower peak brightness, longer reach, more responsive ramp.
  const RIM_MIN = 0.045;
  const RIM_MAX = 0.14;
  const CENTER_MAX = 0.065;

  const DIST_FACTOR = 6.2;      // larger = glow starts farther away
  const POWER = 1.05;           // closer to 1 = more visible at mid distances
  const OUTSIDE_CENTER = 0.32;  // faint inner bloom even before hover

  let raf = 0;
  let lastEvt = null;

  function paint(e){
    for (const btn of btns){
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const maxDist = Math.hypot(rect.width, rect.height) * DIST_FACTOR;
      const raw = Math.max(0, 1 - dist / maxDist);
      const proximity = Math.pow(raw, POWER);

      const rim = RIM_MIN + (RIM_MAX - RIM_MIN) * proximity;
      btn.style.setProperty('--edgeGlow', rim.toFixed(3));

      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom;

      // Clamp pointer to the nearest point on the button so the glow feels “pulled”
      // toward the cursor even before hover.
      const px = Math.min(rect.right, Math.max(rect.left, e.clientX));
      const py = Math.min(rect.bottom, Math.max(rect.top, e.clientY));
      btn.style.setProperty('--x', `${((px - rect.left) / rect.width) * 100}%`);
      btn.style.setProperty('--y', `${((py - rect.top) / rect.height) * 100}%`);

      const centerFactor = inside ? 1 : OUTSIDE_CENTER;
      btn.style.setProperty(
        '--centerGlow',
        (CENTER_MAX * proximity * centerFactor).toFixed(3)
      );
    }
  }

  function onMove(e){
    lastEvt = e;
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      if (lastEvt) paint(lastEvt);
    });
  }

  const reset = () => {
    for (const btn of btns){
      btn.style.setProperty('--edgeGlow', RIM_MIN);
      btn.style.setProperty('--centerGlow', '0');
    }
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('mouseleave', reset);
})();



/* Label example modal (About page) */
(() => {
  const modal = document.getElementById('labelModal');
  if (!modal) return;

  const video = modal.querySelector('video');
  const titleEl = modal.querySelector('[data-label-title]');
  const descEl = modal.querySelector('[data-label-desc]');
  const openers = Array.from(document.querySelectorAll('[data-label-open]'));
  const closers = Array.from(modal.querySelectorAll('[data-modal-close]'));

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    if (video) {
      try { video.pause(); } catch (_) {}
      video.removeAttribute('src');
      video.load();
    }
  }

  function open(btn) {
    // Prefer explicit attributes to avoid layout-coupled parsing
    const explicitTitle = btn.getAttribute('data-title');
    const explicitDesc = btn.getAttribute('data-desc');
    const src = btn.getAttribute('data-video');

    const container = btn.closest('.label-card') || btn.closest('details') || btn.closest('[data-label-container]');
    const title =
      explicitTitle ||
      (container && (container.querySelector('.label-name') || container.querySelector('h3,h4') || container.querySelector('summary'))?.textContent.trim()) ||
      'Example';

    const desc =
      explicitDesc ||
      (container && (container.querySelector('[data-label-text]') || container.querySelector('p'))?.textContent.trim()) ||
      '';

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    if (video && src) {
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.load();
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  }

  for (const btn of openers) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      open(btn);
    });
  }

  for (const el of closers) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();
