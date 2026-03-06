
(() => {
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  const openMenu = () => {
    if (!header || !navToggle || !nav) return;
    header.classList.add('nav-open');
    document.body.classList.add('menu-open');
    navToggle.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    if (!header || !navToggle || !nav) return;
    header.classList.remove('nav-open');
    document.body.classList.remove('menu-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = header.classList.contains('nav-open');
      open ? closeMenu() : openMenu();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (e) => {
      if (!header.classList.contains('nav-open')) return;
      if (header.contains(e.target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) closeMenu();
    });
  }

  // Sticky CTA height
  const sticky = document.querySelector('.sticky-cta');
  const updateSticky = () => {
    if (!sticky) return;
    document.documentElement.style.setProperty('--sticky-h', `${sticky.offsetHeight}px`);
  };
  updateSticky();
  window.addEventListener('resize', updateSticky, { passive: true });
  window.addEventListener('load', updateSticky);

  // Trial modal
  const trialModal = document.getElementById('trialModal');
  if (trialModal) {
    const openers = document.querySelectorAll('[data-trial-open]');
    const closers = trialModal.querySelectorAll('[data-modal-close]');
    const copyBtn = trialModal.querySelector('[data-copy-code]');
    const codeEl = trialModal.querySelector('#trialCode');

    const open = () => {
      trialModal.classList.add('is-open');
      trialModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      trialModal.classList.remove('is-open');
      trialModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (copyBtn) copyBtn.textContent = 'Copy';
    };

    openers.forEach((btn) => btn.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    }));
    closers.forEach((btn) => btn.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && trialModal.classList.contains('is-open')) close();
    });

    if (copyBtn && codeEl) {
      copyBtn.addEventListener('click', async () => {
        const value = codeEl.textContent.trim();
        try {
          await navigator.clipboard.writeText(value);
          copyBtn.textContent = 'Copied';
        } catch (err) {
          const range = document.createRange();
          range.selectNodeContents(codeEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy');
          sel.removeAllRanges();
          copyBtn.textContent = 'Copied';
        }
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 1400);
      });
    }
  }

  // Video modal
  const videoModal = document.getElementById('videoModal');
  if (videoModal) {
    const video = videoModal.querySelector('#videoPlayer');
    const titleEl = videoModal.querySelector('[data-video-title]');
    const descEl = videoModal.querySelector('[data-video-desc]');
    const replayBtn = videoModal.querySelector('[data-video-replay]');
    const openers = document.querySelectorAll('[data-video-open]');
    const closers = videoModal.querySelectorAll('[data-modal-close]');
    let startTime = 0;

    const closeVideo = () => {
      videoModal.classList.remove('is-open');
      videoModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (video) {
        try { video.pause(); } catch (_) {}
        video.removeAttribute('src');
        video.load();
      }
    };

    const playVideo = async () => {
      if (!video) return;
      try {
        if (startTime > 0.05) {
          const setStart = () => {
            try { video.currentTime = startTime; } catch (_) {}
            video.removeEventListener('loadedmetadata', setStart);
          };
          video.addEventListener('loadedmetadata', setStart);
        }
        await video.play();
      } catch (_) {
        // muted autoplay should usually work; if it doesn't, user can replay
      }
    };

    const openVideo = (btn) => {
      const src = btn.getAttribute('data-video');
      titleEl.textContent = btn.getAttribute('data-title') || 'Walkthrough';
      descEl.textContent = btn.getAttribute('data-desc') || '';
      startTime = parseFloat(btn.getAttribute('data-start') || '0') || 0;

      videoModal.classList.add('is-open');
      videoModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      video.src = src;
      video.muted = true;
      video.loop = false;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      playVideo();
    };

    openers.forEach((btn) => btn.addEventListener('click', (e) => {
      e.preventDefault();
      openVideo(btn);
    }));
    closers.forEach((btn) => btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeVideo();
    }));
    replayBtn?.addEventListener('click', () => {
      if (!video) return;
      try {
        video.currentTime = startTime || 0;
        video.play();
      } catch (_) {}
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && videoModal.classList.contains('is-open')) closeVideo();
    });
  }

  // Preview tabs
  const previewTabs = document.querySelectorAll('[data-preview-tab]');
  if (previewTabs.length) {
    const panes = document.querySelectorAll('[data-preview-pane]');
    previewTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-preview-tab');
        previewTabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        panes.forEach((pane) => {
          pane.hidden = pane.getAttribute('data-preview-pane') !== key;
        });
      });
    });
  }

  // Single-open accordion within each accordion group
  document.querySelectorAll('.accordion').forEach((group) => {
    const items = Array.from(group.querySelectorAll('details'));
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  });
})();

/* Cursor-reactive glow for primary CTAs (desktop pointers) */
(() => {
  const btns = Array.from(document.querySelectorAll('.btn--primary[data-glow]'));
  if (!btns.length) return;

  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (!finePointer) return;

  const RIM_MIN = 0.04;
  const RIM_MAX = 0.12;
  const CENTER_MAX = 0.055;
  const DIST_FACTOR = 6.0;
  const POWER = 1.06;
  const OUTSIDE_CENTER = 0.3;

  let raf = 0;
  let lastEvt = null;

  function paint(e){
    btns.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const maxDist = Math.hypot(rect.width, rect.height) * DIST_FACTOR;
      const raw = Math.max(0, 1 - dist / maxDist);
      const proximity = Math.pow(raw, POWER);

      const rim = RIM_MIN + (RIM_MAX - RIM_MIN) * proximity;
      btn.style.setProperty('--edgeGlow', rim.toFixed(3));

      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      const px = Math.min(rect.right, Math.max(rect.left, e.clientX));
      const py = Math.min(rect.bottom, Math.max(rect.top, e.clientY));
      btn.style.setProperty('--x', `${((px - rect.left) / rect.width) * 100}%`);
      btn.style.setProperty('--y', `${((py - rect.top) / rect.height) * 100}%`);

      const centerFactor = inside ? 1 : OUTSIDE_CENTER;
      btn.style.setProperty('--centerGlow', (CENTER_MAX * proximity * centerFactor).toFixed(3));
    });
  }

  function onMove(e){
    lastEvt = e;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (lastEvt) paint(lastEvt);
    });
  }

  function reset(){
    btns.forEach((btn) => {
      btn.style.setProperty('--edgeGlow', RIM_MIN);
      btn.style.setProperty('--centerGlow', '0');
    });
  }

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  reset();
})();
