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
    document.body.classList.add('modal-open');
    // Focus close button for keyboard users
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = () => {
    trialModal.classList.remove('is-open');
    trialModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
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

  const videoReplayBtn = modal.querySelector('[data-video-replay]');
  const videoMuteBtn = modal.querySelector('[data-video-mute]');
  const videoControls = modal.querySelector('.video-controls');
  const videoLinkEl = modal.querySelector('[data-video-link]');
  let videoBuyEl = modal.querySelector('[data-video-buy]');
  if (!videoBuyEl && videoControls) {
    videoBuyEl = document.createElement('a');
    videoBuyEl.className = 'btn btn--sm btn--ghost modal__mobile-buy';
    videoBuyEl.setAttribute('data-video-buy', '');
    videoBuyEl.textContent = 'Buy';
    videoBuyEl.href = 'pricing.html#plans';
    videoControls.appendChild(videoBuyEl);
  }

  let currentVideoMode = 'clip';

  const syncVideoControls = () => {
    if (!video) return;
    if (videoMuteBtn) {
      videoMuteBtn.textContent = video.muted ? 'Unmute' : 'Mute';
      // Only show sound toggle for the main demo; label clips are silent by default.
      videoMuteBtn.style.display = currentVideoMode === 'demo' ? '' : 'none';
    }
    if (videoControls) {
      videoControls.style.display = 'flex';
    }
  };

  // On-brand interaction: tap video to pause/resume (no native controls overlay).
  if (video && !video.dataset.azroTapBound) {
    video.dataset.azroTapBound = '1';
    video.addEventListener('click', () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  if (videoReplayBtn && !videoReplayBtn.dataset.azroBound) {
    videoReplayBtn.dataset.azroBound = '1';
    videoReplayBtn.addEventListener('click', () => {
      if (!video) return;
      video.currentTime = 0;
      video.play().catch(() => {});
    });
  }

  if (videoMuteBtn && !videoMuteBtn.dataset.azroBound) {
    videoMuteBtn.dataset.azroBound = '1';
    videoMuteBtn.addEventListener('click', () => {
      if (!video) return;
      video.muted = !video.muted;
      syncVideoControls();
    });
  }

  const inferBuyLink = (btn) => {
    const explicit = btn.getAttribute('data-buy-link');
    if (explicit) return explicit;
    const basis = [
      btn.getAttribute('data-title') || '',
      btn.textContent || '',
      btn.getAttribute('data-poster') || '',
      btn.getAttribute('data-video') || ''
    ].join(' ').toLowerCase();
    if (basis.includes('xrp')) return 'https://azrosystems.gumroad.com/l/kuvbu';
    if (basis.includes('btc')) return 'https://azrosystems.gumroad.com/l/btc-os-lifetime';
    return 'pricing.html#plans';
  };

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (video) {
      try { video.pause(); } catch (_) {}
      video.currentTime = 0;
      video.muted = true;
      video.loop = false;
      video.controls = false;
      video.removeAttribute('controls');
      video.removeAttribute('src');
      video.load();
      if (typeof syncVideoControls === 'function') syncVideoControls();
    }
  }

  function open(btn) {
    // Prefer explicit attributes to avoid layout-coupled parsing
    const explicitTitle = btn.getAttribute('data-title');
    const explicitDesc = btn.getAttribute('data-desc');
    const src = btn.getAttribute('data-video');
    const poster = btn.getAttribute('data-poster') || 'newchart.png';
		const videoMode = (btn.getAttribute('data-video-mode') || 'clip').toLowerCase();
		currentVideoMode = videoMode;

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
    if (videoLinkEl) {
      videoLinkEl.href = btn.getAttribute('data-doc-link') || 'resources.html#product-downloads';
    }
    if (videoBuyEl) {
      videoBuyEl.href = inferBuyLink(btn);
    }

		if (video && src) {
      video.setAttribute('poster', poster);
			video.src = src;
			// Keep the player chrome clean (avoid native controls overlay).
			video.controls = false;
			video.removeAttribute('controls');

			// UX defaults:
			// - Short illustrative clips: muted + loop.
			// - Long demo overview: start muted for instant playback (user can unmute), no loop.
			video.muted = true;
			video.loop = videoMode !== 'demo';
			if (typeof syncVideoControls === 'function') syncVideoControls();

			video.load();
			const tryPlay = () => {
				if (videoMode === 'demo') {
					try { video.currentTime = 1.15; } catch (_) {}
				}
				const p = video.play();
				if (p && typeof p.catch === 'function') {
					p.catch(() => {
						video.muted = true;
						if (typeof syncVideoControls === 'function') syncVideoControls();
						video.play().catch(() => {});
					});
				}
			};
			if (videoMode === 'demo') {
				const onLoaded = () => {
					video.removeEventListener('loadedmetadata', onLoaded);
					tryPlay();
				};
				video.addEventListener('loadedmetadata', onLoaded);
			} else {
				tryPlay();
			}
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

  // --- Label glossary accordion UX ---
  // Premium/clean behavior: only allow one label open at a time.
  // (Closing others prevents the page from feeling "busy" and reduces scrolling.)
  const glossaryDetails = Array.from(document.querySelectorAll('.accordion details'));
  if (glossaryDetails.length) {
    glossaryDetails.forEach((d) => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        glossaryDetails.forEach((other) => {
          if (other !== d) other.open = false;
        });
      });
    });
  }

  // "Explore label glossary" button: scroll with header offset and open the first item.
  const openGlossaryBtn = document.querySelector('[data-open-glossary]');
  if (openGlossaryBtn) {
    openGlossaryBtn.addEventListener('click', (e) => {
      const href = openGlossaryBtn.getAttribute('href') || '#labels';
      if (!href.startsWith('#')) return;
      const section = document.querySelector(href);
      if (!section) return;

      e.preventDefault();

      const headerEl = document.querySelector('.site-header');
      const offset = (headerEl?.offsetHeight || 0) + 18;
      const top = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      const first = section.querySelector('details');
      if (first) {
        glossaryDetails.forEach((other) => {
          if (other !== first) other.open = false;
        });
        first.open = true;
      }
    });
  }
})();


/* Single-open groups for larger guide / feature cards */
(() => {
  const groups = {};
  document.querySelectorAll('details[data-single-open-group]').forEach((el) => {
    const key = el.getAttribute('data-single-open-group');
    if (!key) return;
    (groups[key] ||= []).push(el);
  });

  const getScrollTop = (item) => {
    const header = document.querySelector('.site-header');
    const offset = (header?.getBoundingClientRect().height || 0) + 18;
    return Math.max(0, item.getBoundingClientRect().top + window.scrollY - offset);
  };

  Object.values(groups).forEach((items) => {
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const targetTop = getScrollTop(item);
            if (Math.abs(window.scrollY - targetTop) > 6) {
              window.scrollTo({ top: targetTop, behavior: 'smooth' });
            }
          });
        });
      });
    });
  });

  const openHashTarget = () => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    let target = null;
    try {
      target = document.querySelector(hash);
    } catch (err) {
      return;
    }
    if (!target) return;

    const details = target.matches('details[data-single-open-group]')
      ? target
      : target.closest('details[data-single-open-group]');
    if (!details) return;

    const key = details.getAttribute('data-single-open-group');
    if (key && groups[key]) {
      groups[key].forEach((other) => {
        if (other !== details) other.open = false;
      });
    }

    if (!details.open) details.open = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetTop = getScrollTop(details);
        if (Math.abs(window.scrollY - targetTop) > 6) {
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      });
    });
  };

  window.addEventListener('hashchange', openHashTarget);
  window.addEventListener('load', () => {
    if (window.location.hash) {
      setTimeout(openHashTarget, 40);
    }
  });
})();


/* Fullscreen image lightbox (sitewide media frames) */
(() => {
  const imageNodes = Array.from(document.querySelectorAll('.media-frame--figure picture img, .media-frame--figure > img'));
  if (!imageNodes.length) return;

  const modal = document.createElement('div');
  modal.className = 'modal image-lightbox';
  modal.id = 'imageLightbox';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal__backdrop" data-image-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="imageLightboxCaption">
      <button class="modal__close" data-image-close type="button" aria-label="Close">✕</button>
      <figure class="image-lightbox__figure">
        <img alt="" />
        <figcaption class="image-lightbox__caption" id="imageLightboxCaption"></figcaption>
      </figure>
    </div>`;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector('img');
  const caption = modal.querySelector('.image-lightbox__caption');
  const closeEls = modal.querySelectorAll('[data-image-close]');
  let lastFocus = null;

  const open = (img) => {
    if (!img) return;
    lastFocus = document.activeElement;
    modalImg.src = img.currentSrc || img.src;
    modalImg.alt = img.alt || '';
    const figure = img.closest('figure');
    const text = figure?.querySelector('figcaption')?.textContent?.trim() || img.alt || 'Preview';
    caption.textContent = text;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.querySelector('.modal__close')?.focus();
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    modalImg.removeAttribute('src');
    caption.textContent = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  closeEls.forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    close();
  }));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  imageNodes.forEach((img) => {
    const trigger = img.closest('figure') || img;
    if (trigger.dataset.imageLightboxBound === '1') return;
    trigger.dataset.imageLightboxBound = '1';
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-label', (img.alt || 'Open image') + ' fullscreen');

    if (trigger.tagName === 'FIGURE' && !trigger.querySelector('.media-fullscreen-btn')) {
      const fsBtn = document.createElement('button');
      fsBtn.type = 'button';
      fsBtn.className = 'media-fullscreen-btn';
      fsBtn.textContent = 'Fullscreen';
      fsBtn.setAttribute('aria-label', 'Open image fullscreen');
      fsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        open(img);
      });
      trigger.appendChild(fsBtn);
    }

    trigger.addEventListener('click', (e) => {
      if (e.target.closest('a,button')) return;
      e.preventDefault();
      open(img);
    });
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(img);
      }
    });
  });
})();

/* Fullscreen option for walkthrough videos (desktop + mobile) */
(() => {
  const modal = document.getElementById('labelModal');
  if (!modal) return;
  const video = modal.querySelector('video');
  const controls = modal.querySelector('.video-controls');
  if (!video || !controls) return;

  let fsBtn = controls.querySelector('[data-video-fullscreen]');
  if (!fsBtn) {
    fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.className = 'btn btn--sm btn--ghost';
    fsBtn.setAttribute('data-video-fullscreen', '');
    fsBtn.textContent = 'Fullscreen';
    controls.insertBefore(fsBtn, controls.firstElementChild?.nextElementSibling || controls.firstElementChild || null);
    if (!controls.contains(fsBtn)) controls.appendChild(fsBtn);
  }

  const requestFS = async () => {
    if (!video || !video.currentSrc && !video.src) return;
    try {
      video.controls = true;
      video.setAttribute('controls', '');
    } catch (_) {}

    const frame = video.closest('.video-frame');
    try { if (video.requestFullscreen) return await video.requestFullscreen(); } catch (_) {}
    try { if (frame && frame.requestFullscreen) return await frame.requestFullscreen(); } catch (_) {}
    try { if (video.webkitRequestFullscreen) return video.webkitRequestFullscreen(); } catch (_) {}
    try { if (frame && frame.webkitRequestFullscreen) return frame.webkitRequestFullscreen(); } catch (_) {}
    try { if (typeof video.webkitEnterFullscreen === 'function') return video.webkitEnterFullscreen(); } catch (_) {}
    try { if (typeof video.webkitEnterFullScreen === 'function') return video.webkitEnterFullScreen(); } catch (_) {}
    const src = video.currentSrc || video.src;
    if (src) window.open(src, '_blank', 'noopener');
  };

  fsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    requestFS();
  });

  const resetChrome = () => {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    const active = !!fsEl && (fsEl === video || fsEl === video.closest('.video-frame') || fsEl.contains?.(video));
    if (!active) {
      try {
        video.controls = false;
        video.removeAttribute('controls');
      } catch (_) {}
    }
  };

  document.addEventListener('fullscreenchange', resetChrome);
  document.addEventListener('webkitfullscreenchange', resetChrome);
  video.addEventListener('webkitendfullscreen', resetChrome);
})();


/* Footer email capture (static-site safe mailto fallback) */
(() => {
  const forms = Array.from(document.querySelectorAll('[data-join-email-form]'));
  if (!forms.length) return;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  forms.forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const status = form.parentElement?.querySelector('[data-join-email-status]');
    if (!input) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (input.value || '').trim();

      if (!email || !emailPattern.test(email)) {
        if (status) status.textContent = 'Enter a valid email address.';
        input.focus();
        return;
      }

      if (status) status.textContent = 'Opening your email app…';
      const subject = encodeURIComponent('Join AZRO updates and reward codes');
      const body = encodeURIComponent(`Please add this email to AZRO updates and reward codes:

${email}`);
      window.location.href = `mailto:support@azrosystems.com?subject=${subject}&body=${body}`;
    });
  });
})();


/* Generic copy buttons */
(() => {
  const copyButtons = document.querySelectorAll('[data-copy-text]');
  if (!copyButtons.length) return;

  const copyText = async (btn) => {
    const text = btn.getAttribute('data-copy-text') || '';
    if (!text) return;
    const original = btn.textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = original; }, 1600);
    } catch (err) {
      const probe = document.createElement('textarea');
      probe.value = text;
      probe.setAttribute('readonly', '');
      probe.style.position = 'absolute';
      probe.style.left = '-9999px';
      document.body.appendChild(probe);
      probe.select();
      try {
        document.execCommand('copy');
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = original; }, 1600);
      } finally {
        probe.remove();
      }
    }
  };

  copyButtons.forEach((btn) => {
    btn.addEventListener('click', () => copyText(btn));
  });
})();

/* Inline media galleries (home hero + product previews) */
(() => {
  const roots = Array.from(document.querySelectorAll('[data-gallery-root]'));
  if (!roots.length) return;

  let lightbox = document.getElementById('galleryLightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'modal gallery-lightbox';
    lightbox.id = 'galleryLightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
      <div class="modal__backdrop" data-gallery-close></div>
      <div class="modal__dialog modal__dialog--gallery" role="dialog" aria-modal="true" aria-labelledby="galleryLightboxTitle">
        <button class="modal__close" data-gallery-close type="button" aria-label="Close">✕</button>
        <div class="modal__head gallery-lightbox__head">
          <h2 id="galleryLightboxTitle">Preview gallery</h2>
          <p data-gallery-lightbox-caption>Preview the media.</p>
        </div>
        <div class="gallery-lightbox__viewport" data-gallery-lightbox-viewport>
          <button class="media-gallery__nav media-gallery__nav--prev" data-gallery-lightbox-prev type="button" aria-label="Previous item">‹</button>
          <div class="gallery-lightbox__stage" data-gallery-lightbox-stage></div>
          <button class="media-gallery__nav media-gallery__nav--next" data-gallery-lightbox-next type="button" aria-label="Next item">›</button>
        </div>
        <div class="gallery-lightbox__footer">
          <div class="media-gallery__dots" data-gallery-lightbox-dots></div>
        </div>
      </div>`;
    document.body.appendChild(lightbox);
  }

  const lbViewport = lightbox.querySelector('[data-gallery-lightbox-viewport]');
  const lbStage = lightbox.querySelector('[data-gallery-lightbox-stage]');
  const lbDots = lightbox.querySelector('[data-gallery-lightbox-dots]');
  const lbCaption = lightbox.querySelector('[data-gallery-lightbox-caption]');
  const lbTitle = lightbox.querySelector('#galleryLightboxTitle');
  const lbPrev = lightbox.querySelector('[data-gallery-lightbox-prev]');
  const lbNext = lightbox.querySelector('[data-gallery-lightbox-next]');
  const lbClose = lightbox.querySelectorAll('[data-gallery-close]');

  let activeController = null;
  let activeSet = 'image';
  let lastFocus = null;
  let activeLightboxVideo = null;

  const pauseActiveLightboxVideo = () => {
    if (activeLightboxVideo) {
      try { activeLightboxVideo.pause(); } catch (err) {}
      activeLightboxVideo = null;
    }
  };

  const closeLightbox = () => {
    pauseActiveLightboxVideo();
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lbStage.innerHTML = '';
    lbDots.innerHTML = '';
    activeController = null;
    activeSet = 'image';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  const getItemsForSet = (controller, setName) => {
    if (!controller) return [];
    return setName === 'video' ? (controller.data.videos || []) : (controller.data.images || []);
  };

  const getCurrentIndex = (controller, setName) => controller.indices[setName] || 0;

  const updatePreviewFromLightbox = () => {
    if (!activeController) return;
    activeController.render(activeSet);
  };

  const renderLightbox = () => {
    if (!activeController) return;
    const items = getItemsForSet(activeController, activeSet);
    if (!items.length) return;

    const currentIndex = getCurrentIndex(activeController, activeSet);
    const current = items[currentIndex];
    lbViewport.style.aspectRatio = activeController.root.style.getPropertyValue('--gallery-ratio') || '16 / 9';
    lbTitle.textContent = activeController.data.title || 'Preview gallery';
    lbCaption.textContent = current.label || activeController.data.caption || 'Preview the media.';

    pauseActiveLightboxVideo();
    lbStage.innerHTML = '';

    if (activeSet === 'video') {
      const videoWrap = document.createElement('div');
      videoWrap.className = 'gallery-lightbox__video-wrap';

      const video = document.createElement('video');
      video.className = 'gallery-lightbox__video';
      video.src = current.src;
      if (current.poster) video.poster = current.poster;
      video.preload = 'metadata';
      video.controls = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      videoWrap.appendChild(video);
      lbStage.appendChild(videoWrap);
      activeLightboxVideo = video;

      const tryPlay = () => {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      };
      requestAnimationFrame(tryPlay);
    } else {
      const img = document.createElement('img');
      img.src = current.src;
      img.alt = current.alt || current.label || activeController.data.title || 'Preview';
      img.decoding = 'async';
      img.loading = 'eager';
      lbStage.appendChild(img);
    }

    lbDots.innerHTML = '';
    if (items.length > 1) {
      items.forEach((item, idx) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'media-gallery__dot' + (idx === currentIndex ? ' is-active' : '');
        dot.setAttribute('aria-label', `Open ${activeSet} ${idx + 1}`);
        dot.addEventListener('click', () => {
          activeController.indices[activeSet] = idx;
          renderLightbox();
          updatePreviewFromLightbox();
        });
        lbDots.appendChild(dot);
      });
    }

    const showNav = items.length > 1;
    lbPrev.hidden = !showNav;
    lbNext.hidden = !showNav;
  };

  const openLightbox = (controller, setName) => {
    const desiredSet = setName === 'video' ? 'video' : 'image';
    const items = getItemsForSet(controller, desiredSet);
    if (!items.length) return;

    activeController = controller;
    activeSet = desiredSet;
    lastFocus = document.activeElement;
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    lightbox.querySelector('.modal__close')?.focus();
  };

  lbPrev?.addEventListener('click', () => {
    if (!activeController) return;
    const items = getItemsForSet(activeController, activeSet);
    if (!items.length) return;
    activeController.indices[activeSet] = (getCurrentIndex(activeController, activeSet) - 1 + items.length) % items.length;
    renderLightbox();
    updatePreviewFromLightbox();
  });

  lbNext?.addEventListener('click', () => {
    if (!activeController) return;
    const items = getItemsForSet(activeController, activeSet);
    if (!items.length) return;
    activeController.indices[activeSet] = (getCurrentIndex(activeController, activeSet) + 1) % items.length;
    renderLightbox();
    updatePreviewFromLightbox();
  });

  lbClose.forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    closeLightbox();
  }));

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lbPrev?.click();
    if (e.key === 'ArrowRight') lbNext?.click();
  });

  roots.forEach((root) => {
    const dataScript = root.querySelector('.media-gallery__data');
    if (!dataScript) return;

    let data = {};
    try {
      data = JSON.parse(dataScript.textContent || '{}');
    } catch (err) {
      return;
    }

    const stage = root.querySelector('[data-gallery-stage]');
    const modeButtons = Array.from(root.querySelectorAll('[data-gallery-set]'));
    const dots = root.querySelector('[data-gallery-dots]');
    const prev = root.querySelector('[data-gallery-prev]');
    const next = root.querySelector('[data-gallery-next]');

    const controller = {
      root,
      data,
      mode: root.getAttribute('data-default-mode') === 'image' ? 'image' : ((data.videos || []).length ? 'video' : 'image'),
      indices: { image: 0, video: 0 },
      render(modeOverride) {
        if (modeOverride) this.mode = modeOverride;
        const modeKey = this.mode === 'video' && (this.data.videos || []).length ? 'video' : 'image';
        this.mode = modeKey;
        const items = getItemsForSet(this, modeKey);
        if (!items.length) return;
        const current = items[getCurrentIndex(this, modeKey)] || items[0];

        root.classList.toggle('is-video-mode', modeKey === 'video');
        root.classList.toggle('is-image-mode', modeKey === 'image');
        modeButtons.forEach((btn) => {
          const active = btn.getAttribute('data-gallery-set') === modeKey;
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        stage.innerHTML = '';
        const launch = document.createElement('button');
        launch.type = 'button';
        launch.className = 'media-gallery__launch media-gallery__launch--' + modeKey;
        launch.setAttribute('aria-label', modeKey === 'video' ? `Play ${this.data.title || 'preview videos'}` : `View ${this.data.title || 'preview images'}`);

        const visual = document.createElement(modeKey === 'video' ? 'img' : 'img');
        visual.className = modeKey === 'video' ? 'media-gallery__poster' : 'media-gallery__image';
        visual.src = modeKey === 'video' ? (current.poster || current.src) : current.src;
        visual.alt = current.alt || current.label || this.data.title || 'Preview';
        visual.decoding = 'async';
        visual.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'media-gallery__overlay';

        const count = document.createElement('div');
        count.className = 'media-gallery__count';
        count.textContent = `${items.length} ${modeKey === 'video' ? (items.length === 1 ? 'video' : 'videos') : (items.length === 1 ? 'image' : 'images')}`;

        const action = document.createElement('span');
        action.className = 'media-gallery__launch-cta';
        action.textContent = modeKey === 'video' ? 'Play' : 'View';

        launch.addEventListener('click', () => openLightbox(this, modeKey));
        overlay.append(count, action);
        launch.append(visual, overlay);
        stage.appendChild(launch);

        if (dots) dots.innerHTML = '';
        if (prev) prev.hidden = true;
        if (next) next.hidden = true;
      }
    };

    root._galleryController = controller;

    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetMode = btn.getAttribute('data-gallery-set');
        if (targetMode === controller.mode) return;
        if (targetMode === 'video' && !(controller.data.videos || []).length) return;
        if (targetMode === 'image' && !(controller.data.images || []).length) return;
        controller.render(targetMode);
      });
    });

    controller.render();
  });
})();
