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
      if (window.innerWidth > 920) setOpen(false);
    });
  }

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

  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer =
    window.matchMedia && window.matchMedia('(pointer:fine)').matches;

  if (prefersReduced || !finePointer) return;

  const RIM_MIN = 0.15;
  const RIM_MAX = 0.60;
  const CENTRE_MAX = 0.40;

  function updateGlow(e){
    for (const btn of btns){
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const maxDist = Math.hypot(rect.width, rect.height) * 2;
      const proximity = Math.max(0, 1 - dist / maxDist);

      const rim = RIM_MIN + (RIM_MAX - RIM_MIN) * proximity;
      btn.style.setProperty('--edgeGlow', rim.toFixed(3));

      // Only show the inner glow when the pointer is on the button.
      if (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom
      ){
        btn.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        btn.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
        btn.style.setProperty('--centerGlow', (CENTRE_MAX * proximity).toFixed(3));
      } else {
        btn.style.setProperty('--centerGlow', 0);
      }
    }
  }

  /* passive pointermove for smoother scroll-performance */
  window.addEventListener('pointermove', updateGlow, { passive: true });
  window.addEventListener('pointerleave', () => {
    for (const btn of btns){
      btn.style.setProperty('--edgeGlow', RIM_MIN);
      btn.style.setProperty('--centerGlow', 0);
    }
  });
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
