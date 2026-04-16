(function () {
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
  const sticky = document.querySelector('.sticky-cta');
  const updateSticky = () => {
    if (!sticky) return;
    const h = Math.ceil(sticky.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--sticky-h', `${h}px`);
  };
  updateSticky();
  window.addEventListener('resize', updateSticky, { passive: true });
  const trialModal = document.getElementById('trialModal');
  if (!trialModal) return;

  const openers = document.querySelectorAll('[data-trial-open]');
  const closers = trialModal.querySelectorAll('[data-modal-close]');
  const closeBtn = trialModal.querySelector('.modal__close');
  const copyBtn = trialModal.querySelector('[data-copy-code]');
  const codeEl = trialModal.querySelector('#trialCode');

  const resetTrialModalScroll = () => {
    const dialog = trialModal.querySelector('.modal__dialog');
    if (trialModal.scrollTo) {
      trialModal.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      trialModal.scrollTop = 0;
    }
    trialModal.scrollTop = 0;
    if (dialog) {
      if (dialog.scrollTo) {
        dialog.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } else {
        dialog.scrollTop = 0;
      }
      dialog.scrollTop = 0;
    }
  };

  const openModal = () => {
    resetTrialModalScroll();
    trialModal.classList.add('is-open');
    trialModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      resetTrialModalScroll();
      setTimeout(resetTrialModalScroll, 60);
      setTimeout(resetTrialModalScroll, 180);
      setTimeout(resetTrialModalScroll, 320);
      if (window.innerWidth <= 760) {
        const dialog = trialModal.querySelector('.modal__dialog');
        if (dialog && typeof dialog.scrollIntoView === 'function') {
          try {
            dialog.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
          } catch (err) {
            try {
              dialog.scrollIntoView(true);
            } catch (err2) {
              
            }
          }
        }
      }
      if (closeBtn && typeof closeBtn.focus === 'function') {
        try {
          closeBtn.focus({ preventScroll: true });
        } catch (err) {
          closeBtn.focus();
        }
      }
    });
  };

  const closeModal = () => {
    trialModal.classList.remove('is-open');
    trialModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    resetTrialModalScroll();
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

(() => {
  const btns = Array.from(document.querySelectorAll('.btn--primary[data-glow]'));
  if (!btns.length) return;
  for (const btn of btns){
    btn.style.setProperty('--edgeGlow', '0.08');
    btn.style.setProperty('--centerGlow', '0');
    btn.style.setProperty('--x', '50%');
    btn.style.setProperty('--y', '50%');
  }
})();

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
      videoMuteBtn.style.display = currentVideoMode === 'demo' ? '' : 'none';
    }
    if (videoControls) {
      videoControls.style.display = 'flex';
    }
  };
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
      try { video.currentTime = 0; } catch (_) {}
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
    if (basis.includes('xrp')) return 'https://azrosystems.gumroad.com/l/xrp-topbottom-indicator-lifetime';
    if (basis.includes('btc')) return 'https://azrosystems.gumroad.com/l/btc-operating-system-lifetime';
    return 'pricing.html#plans';
  };

  const resolveVideoPoster = (btn, src) => {
    const explicit = btn.getAttribute('data-poster');
    if (explicit) return explicit;
    if (src && /\.mp4(?:[?#].*)?$/i.test(src)) {
      return src.replace(/\.mp4((?:[?#].*)?)$/i, '-poster.webp$1');
    }
    return '';
  };

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    if (video) {
      try { video.pause(); } catch (_) {}
      try { video.currentTime = 0; } catch (_) {}
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
    const explicitTitle = btn.getAttribute('data-title');
    const explicitDesc = btn.getAttribute('data-desc');
    const src = btn.getAttribute('data-video');
    const poster = resolveVideoPoster(btn, src);
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
      try { video.pause(); } catch (_) {}
      try { video.currentTime = 0; } catch (_) {}
      video.removeAttribute('src');
      video.load();
      if (poster) {
        video.setAttribute('poster', poster);
      } else {
        video.removeAttribute('poster');
      }
			video.src = src;
			video.preload = 'metadata';
			video.controls = false;
			video.removeAttribute('controls');
			video.muted = true;
			video.loop = videoMode !== 'demo';
			if (typeof syncVideoControls === 'function') syncVideoControls();

			video.load();
			const tryPlay = () => {
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
    document.documentElement.classList.add('modal-open');
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
      <button class="gallery-lightbox__fullscreen image-lightbox__fullscreen" data-image-fullscreen type="button" aria-label="Enter fullscreen" aria-pressed="false">⤢</button>
      <figure class="image-lightbox__figure">
        <img alt="" />
        <figcaption class="image-lightbox__caption" id="imageLightboxCaption"></figcaption>
      </figure>
    </div>`;
  document.body.appendChild(modal);

  const dialog = modal.querySelector('.modal__dialog');
  const modalImg = modal.querySelector('img');
  const caption = modal.querySelector('.image-lightbox__caption');
  const closeEls = modal.querySelectorAll('[data-image-close]');
  const fullscreenBtn = modal.querySelector('[data-image-fullscreen]');
  let lastFocus = null;
  let imageFullscreenMode = false;

  const getFullscreenElement = () => (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
  );

  const isNativeFullscreen = () => {
    const fsEl = getFullscreenElement();
    return !!(fsEl && (fsEl === dialog || (dialog && dialog.contains(fsEl))));
  };

  const syncFullscreenButton = () => {
    if (!fullscreenBtn) return;
    const active = imageFullscreenMode || isNativeFullscreen();
    fullscreenBtn.classList.toggle('is-active', active);
    fullscreenBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    fullscreenBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    fullscreenBtn.textContent = active ? '⤡' : '⤢';
  };

  const setImageFullscreenMode = (active) => {
    imageFullscreenMode = !!active;
    modal.classList.toggle('is-image-fullscreen', !!active);
    syncFullscreenButton();
  };

  const requestImageFullscreen = async () => {
    if (!dialog) return false;
    try {
      if (dialog.requestFullscreen) {
        await dialog.requestFullscreen();
        return true;
      }
    } catch (_) {}
    try {
      if (dialog.webkitRequestFullscreen) {
        dialog.webkitRequestFullscreen();
        return true;
      }
    } catch (_) {}
    return false;
  };

  const exitImageFullscreen = async () => {
    const fsEl = getFullscreenElement();
    if (!fsEl) return false;
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      }
    } catch (_) {}
    try {
      if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        return true;
      }
    } catch (_) {}
    return false;
  };

  const toggleImageFullscreen = async () => {
    if (!modal.classList.contains('is-open')) return;

    if (imageFullscreenMode || isNativeFullscreen()) {
      setImageFullscreenMode(false);
      await exitImageFullscreen();
      return;
    }

    const enteredNative = await requestImageFullscreen();
    if (enteredNative || isNativeFullscreen()) {
      setImageFullscreenMode(true);
      return;
    }

    setImageFullscreenMode(true);
  };

  const open = (img) => {
    if (!img) return;
    lastFocus = document.activeElement;
    modalImg.src = img.currentSrc || img.src;
    modalImg.alt = img.alt || '';
    const figure = img.closest('figure');
    const text = figure?.querySelector('figcaption')?.textContent?.trim() || img.alt || 'Preview';
    caption.textContent = text;
    setImageFullscreenMode(false);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    modal.querySelector('.modal__close')?.focus();
  };

  const close = () => {
    setImageFullscreenMode(false);
    exitImageFullscreen();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    modalImg.removeAttribute('src');
    caption.textContent = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  closeEls.forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    close();
  }));

  fullscreenBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleImageFullscreen();
  });

  const handleImageFullscreenChange = () => {
    setImageFullscreenMode(isNativeFullscreen());
  };

  document.addEventListener('fullscreenchange', handleImageFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleImageFullscreenChange);

  modalImg?.addEventListener('click', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (!imageFullscreenMode || isNativeFullscreen()) return;
    e.preventDefault();
    e.stopPropagation();
    setImageFullscreenMode(false);
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key !== 'Escape') return;
    if (imageFullscreenMode || isNativeFullscreen()) {
      e.preventDefault();
      setImageFullscreenMode(false);
      exitImageFullscreen();
      return;
    }
    close();
  });

  imageNodes.forEach((img) => {
    const trigger = img.closest('figure') || img;
    if (trigger.dataset.imageLightboxBound === '1') return;
    trigger.dataset.imageLightboxBound = '1';
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-label', (img.alt || 'Open image') + ' preview');

    let buttonHost = trigger;
    if (trigger.tagName === 'FIGURE') {
      const mediaChild = trigger.querySelector('picture, img');
      let visualHost = trigger.querySelector('.media-figure__visual');
      if (!visualHost && mediaChild) {
        visualHost = document.createElement('div');
        visualHost.className = 'media-figure__visual';
        trigger.insertBefore(visualHost, mediaChild);
        visualHost.appendChild(mediaChild);
      }
      if (visualHost) buttonHost = visualHost;
    }

    if (trigger.tagName === 'FIGURE' && buttonHost && !buttonHost.querySelector('.media-fullscreen-btn')) {
      const fsBtn = document.createElement('button');
      fsBtn.type = 'button';
      fsBtn.className = 'media-fullscreen-btn';
      fsBtn.textContent = 'View';
      fsBtn.setAttribute('aria-label', 'View image');
      fsBtn.setAttribute('data-media-expand', 'image');
      fsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        open(img);
      });
      buttonHost.appendChild(fsBtn);
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

(() => {
  const forms = Array.from(document.querySelectorAll('[data-join-email-form]'));
  if (!forms.length) return;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const endpoint = 'https://formsubmit.co/ajax/support@azrosystems.com';

  forms.forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const status = form.parentElement?.querySelector('[data-join-email-status]');
    const submitButton = form.querySelector('button[type="submit"]');
    if (!input) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (input.value || '').trim();

      if (!email || !emailPattern.test(email)) {
        if (status) status.textContent = 'Enter a valid email address.';
        input.focus();
        return;
      }

      if (status) status.textContent = 'Submitting…';
      if (submitButton) submitButton.disabled = true;

      const formData = new FormData(form);
      formData.set('email', email);
      formData.set('list', 'AZRO email list');
      formData.set('signup_location', 'Footer');
      formData.set('source_page', window.location.pathname || '');
      formData.set('source_title', document.title || '');
      formData.set('_subject', 'AZRO email list signup');
      formData.set('_template', 'table');
      formData.set('_url', window.location.href);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
        });

        let data = null;
        try {
          data = await response.json();
        } catch (_) {}

        if (!response.ok || data?.success === false || data?.success === 'false') {
          throw new Error('formsubmit-error');
        }

        form.reset();
        if (status) status.textContent = 'Thanks — signup received.';
      } catch (err) {
        if (status) status.textContent = 'Redirecting to secure signup…';
        form.submit();
        return;
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  });
})();

(() => {
  const CANONICAL_ADDRESSES = {
    btc: 'bc1q6sfmlwf8vpyqcyyh68hdx4k4t4qksmn9kqpdt6',
    xrp: 'rNHnFQ39rJdzzuCv1RnUBwK5zM1sJAmnoM'
  };

  const btcAddress = document.getElementById('btcAddress');
  const xrpAddress = document.getElementById('xrpAddress');

  if (btcAddress) btcAddress.textContent = CANONICAL_ADDRESSES.btc;
  if (xrpAddress) xrpAddress.textContent = CANONICAL_ADDRESSES.xrp;

  document.querySelectorAll('[data-copy-target="#btcAddress"]').forEach((btn) => {
    btn.setAttribute('data-copy-text', CANONICAL_ADDRESSES.btc);
  });
  document.querySelectorAll('[data-copy-target="#xrpAddress"]').forEach((btn) => {
    btn.setAttribute('data-copy-text', CANONICAL_ADDRESSES.xrp);
  });

  const copyButtons = document.querySelectorAll('[data-copy-text], [data-copy-target]');
  if (!copyButtons.length) return;

  const getButtonCopyText = (btn) => {
    const targetSelector = btn.getAttribute('data-copy-target');
    if (targetSelector) {
      const target = document.querySelector(targetSelector);
      const targetText = target ? (target.textContent || '').trim() : '';
      if (targetText) return targetText;
    }
    return btn.getAttribute('data-copy-text') || '';
  };

  const copyText = async (btn) => {
    const text = getButtonCopyText(btn);
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
      <div class="modal__dialog modal__dialog--gallery" role="dialog" aria-modal="true" aria-label="Preview gallery">
        <button class="modal__close" data-gallery-close type="button" aria-label="Close">✕</button>
        <button class="gallery-lightbox__fullscreen" data-gallery-lightbox-fullscreen type="button" aria-label="Enter fullscreen" aria-pressed="false">⤢</button>
        <div class="gallery-lightbox__viewport" data-gallery-lightbox-viewport>
          <button class="media-gallery__nav media-gallery__nav--prev" data-gallery-lightbox-prev type="button" aria-label="Previous item">‹</button>
          <div class="gallery-lightbox__stage" data-gallery-lightbox-stage></div>
          <button class="media-gallery__nav media-gallery__nav--next" data-gallery-lightbox-next type="button" aria-label="Next item">›</button>
        </div>
        <div class="gallery-lightbox__footer">
          <div class="gallery-lightbox__meta">
            <p class="gallery-lightbox__caption" data-gallery-lightbox-caption></p>
            <p class="gallery-lightbox__note" data-gallery-lightbox-note></p>
          </div>
          <div class="media-gallery__dots" data-gallery-lightbox-dots></div>
        </div>
      </div>`;
    document.body.appendChild(lightbox);
  }

  const lbViewport = lightbox.querySelector('[data-gallery-lightbox-viewport]');
  const lbSwitch = lightbox.querySelector('[data-gallery-lightbox-switch]');
  const lbModeButtons = Array.from(lightbox.querySelectorAll('[data-gallery-lightbox-set]'));
  const lbStage = lightbox.querySelector('[data-gallery-lightbox-stage]');
  const lbDots = lightbox.querySelector('[data-gallery-lightbox-dots]');
  const lbCaption = lightbox.querySelector('[data-gallery-lightbox-caption]');
  const lbNote = lightbox.querySelector('[data-gallery-lightbox-note]');
  const lbDialog = lightbox.querySelector('.modal__dialog--gallery');
  const lbPrev = lightbox.querySelector('[data-gallery-lightbox-prev]');
  const lbNext = lightbox.querySelector('[data-gallery-lightbox-next]');
  const lbClose = lightbox.querySelectorAll('[data-gallery-close]');
  const lbFullscreen = lightbox.querySelector('[data-gallery-lightbox-fullscreen]');

  let activeController = null;
  let activeSet = 'image';
  let lastFocus = null;
  let activeLightboxVideo = null;
  let activeLightboxVideoSrc = '';
  let activeLightboxRenderToken = 0;
  let galleryFullscreenMode = false;
  let activeLightboxVideoPoolController = null;
  let lightboxVideoPoolHost = null;
  let lightboxVideoPool = new Map();

  const getFullscreenElement = () => (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
  );

  const isLightboxNativeFullscreen = () => {
    const fsEl = getFullscreenElement();
    return !!(fsEl && (fsEl === lbDialog || (lbDialog && lbDialog.contains(fsEl))));
  };

  const syncGalleryFullscreenButton = () => {
    if (!lbFullscreen) return;
    const active = galleryFullscreenMode || isLightboxNativeFullscreen();
    lbFullscreen.classList.toggle('is-active', active);
    lbFullscreen.setAttribute('aria-pressed', active ? 'true' : 'false');
    lbFullscreen.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    lbFullscreen.textContent = active ? '⤡' : '⤢';
  };

  const setGalleryFullscreenMode = (active) => {
    galleryFullscreenMode = !!active;
    lightbox.classList.toggle('is-gallery-fullscreen', !!active);
    syncGalleryFullscreenButton();
  };

  const requestGalleryFullscreen = async () => {
    if (!lbDialog) return false;
    try {
      if (lbDialog.requestFullscreen) {
        await lbDialog.requestFullscreen();
        return true;
      }
    } catch (err) {}
    try {
      if (lbDialog.webkitRequestFullscreen) {
        lbDialog.webkitRequestFullscreen();
        return true;
      }
    } catch (err) {}
    return false;
  };

  const exitGalleryFullscreen = async () => {
    const fsEl = getFullscreenElement();
    if (!fsEl) return false;
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      }
    } catch (err) {}
    try {
      if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        return true;
      }
    } catch (err) {}
    return false;
  };

  const toggleGalleryFullscreen = async () => {
    if (!lightbox.classList.contains('is-open')) return;

    if (isLightboxNativeFullscreen() || galleryFullscreenMode) {
      setGalleryFullscreenMode(false);
      await exitGalleryFullscreen();
      return;
    }

    const enteredNative = await requestGalleryFullscreen();
    if (enteredNative || isLightboxNativeFullscreen()) {
      setGalleryFullscreenMode(true);
      return;
    }

    if (activeSet === 'video') {
      const activeVideo = lbStage.querySelector('video');
      try {
        if (typeof activeVideo?.webkitEnterFullscreen === 'function') {
          activeVideo.webkitEnterFullscreen();
          return;
        }
      } catch (err) {}
      try {
        if (typeof activeVideo?.webkitEnterFullScreen === 'function') {
          activeVideo.webkitEnterFullScreen();
          return;
        }
      } catch (err) {}
      setGalleryFullscreenMode(false);
      return;
    }

    setGalleryFullscreenMode(true);
  };

  const pauseActiveLightboxVideo = () => {
    if (activeLightboxVideo) {
      try { activeLightboxVideo.pause(); } catch (err) {}
      activeLightboxVideo = null;
      activeLightboxVideoSrc = '';
    }
  };

  const resetLightboxVideoElement = (video) => {
    if (!video) return;
    try { video.pause(); } catch (err) {}
    try { video.currentTime = 0; } catch (err) {}
    video.controls = false;
    video.removeAttribute('controls');
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.loop = true;
    video.autoplay = false;
  };

  const teardownLightboxVideoPool = () => {
    lightboxVideoPool.forEach((entry) => {
      resetLightboxVideoElement(entry.video);
      try { entry.wrap.remove(); } catch (err) {}
    });
    lightboxVideoPool.clear();
    if (lightboxVideoPoolHost && lightboxVideoPoolHost.isConnected) {
      lightboxVideoPoolHost.remove();
    }
    lightboxVideoPoolHost = null;
    activeLightboxVideoPoolController = null;
  };

  const createLightboxVideoPoolEntry = (src) => {
    const wrap = document.createElement('div');
    wrap.className = 'gallery-lightbox__video-wrap';

    const video = document.createElement('video');
    video.className = 'gallery-lightbox__video';
    video.src = src;
    video.preload = 'auto';
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.loop = true;
    video.autoplay = false;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('poster', '');
    wrap.appendChild(video);

    const entry = {
      src,
      wrap,
      video,
      primed: false,
      primeQueued: false,
      primeInFlight: false,
    };

    const markPrimed = () => {
      if (video === activeLightboxVideo) return;
      entry.primed = true;
      entry.primeInFlight = false;
      resetLightboxVideoElement(video);
    };

    video.addEventListener('loadeddata', () => {
      if (video === activeLightboxVideo) return;
      if (video.readyState >= 2) entry.primed = true;
    });
    video.addEventListener('canplay', () => {
      if (video === activeLightboxVideo) return;
      if (video.readyState >= 2) entry.primed = true;
    });
    video.addEventListener('timeupdate', () => {
      if (video === activeLightboxVideo) return;
      if (video.currentTime > 0.04) markPrimed();
    });
    video.addEventListener('error', () => {
      entry.primeInFlight = false;
    });

    return entry;
  };

  const ensureLightboxVideoPool = (controller) => {
    const items = controller && controller.data && Array.isArray(controller.data.videos) ? controller.data.videos : [];
    if (!items.length) return null;

    if (activeLightboxVideoPoolController === controller && lightboxVideoPoolHost && lightboxVideoPool.size) {
      return lightboxVideoPool;
    }

    teardownLightboxVideoPool();
    activeLightboxVideoPoolController = controller;
    lightboxVideoPoolHost = document.createElement('div');
    lightboxVideoPoolHost.setAttribute('aria-hidden', 'true');
    lightboxVideoPoolHost.style.position = 'absolute';
    lightboxVideoPoolHost.style.left = '-9999px';
    lightboxVideoPoolHost.style.top = '-9999px';
    lightboxVideoPoolHost.style.width = '1px';
    lightboxVideoPoolHost.style.height = '1px';
    lightboxVideoPoolHost.style.opacity = '0';
    lightboxVideoPoolHost.style.pointerEvents = 'none';
    lightboxVideoPoolHost.style.overflow = 'hidden';
    lightboxVideoPoolHost.className = 'gallery-lightbox__preload-pool';
    lbDialog.appendChild(lightboxVideoPoolHost);

    items.forEach((item) => {
      const entry = createLightboxVideoPoolEntry(item.src);
      lightboxVideoPool.set(item.src, entry);
      lightboxVideoPoolHost.appendChild(entry.wrap);
      try { entry.video.load(); } catch (err) {}
    });

    return lightboxVideoPool;
  };

  const primeLightboxVideoEntry = (entry, aggressive = false) => {
    if (!entry || !entry.video || entry.video === activeLightboxVideo) return;
    if (entry.primed && !aggressive) return;
    if (entry.primeInFlight) return;

    const video = entry.video;
    entry.primeInFlight = true;

    const settle = () => {
      entry.primeInFlight = false;
      if (video === activeLightboxVideo) return;
      if (video.readyState >= 2) entry.primed = true;
      resetLightboxVideoElement(video);
    };

    if (video.readyState < 2) {
      try { video.load(); } catch (err) {}
    }

    const playPromise = (() => {
      try { return video.play(); } catch (err) { return null; }
    })();

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        window.setTimeout(settle, aggressive ? 180 : 110);
      }).catch(() => {
        entry.primeInFlight = false;
        if (video.readyState >= 2) entry.primed = true;
      });
      return;
    }

    window.setTimeout(settle, aggressive ? 180 : 110);
  };

  const primeLightboxVideoPool = (controller, currentIndex = 0) => {
    if (!controller) return;
    const items = getItemsForSet(controller, 'video');
    if (!items.length) return;
    const pool = ensureLightboxVideoPool(controller);
    if (!pool) return;

    const order = [];
    const seen = new Set();
    const normalizedCurrent = ((currentIndex % items.length) + items.length) % items.length;
    const preferred = [normalizedCurrent, (normalizedCurrent + 1) % items.length, (normalizedCurrent - 1 + items.length) % items.length];
    preferred.concat(items.map((_, idx) => idx)).forEach((idx) => {
      if (seen.has(idx)) return;
      seen.add(idx);
      order.push(idx);
    });

    order.forEach((idx, orderIdx) => {
      const entry = pool.get(items[idx].src);
      if (!entry || entry.video === activeLightboxVideo) return;
      if (entry.primeQueued) return;
      entry.primeQueued = true;
      window.setTimeout(() => {
        entry.primeQueued = false;
        primeLightboxVideoEntry(entry, orderIdx < 3);
      }, orderIdx * 20);
    });
  };

  const getVideoReadyThreshold = () => (
    window.matchMedia('(max-width: 820px), (pointer: coarse)').matches ? 0.16 : 0.05
  );

  const updateLightboxModeSwitch = () => {
    if (lbSwitch) {
      lbSwitch.hidden = true;
      lbSwitch.setAttribute('aria-hidden', 'true');
    }

    lbModeButtons.forEach((btn) => {
      btn.hidden = true;
      btn.disabled = true;
      btn.classList.remove('is-active');
      btn.setAttribute('aria-pressed', 'false');
    });

    lightbox.classList.toggle('is-video-mode', activeSet === 'video');
    lightbox.classList.toggle('is-image-mode', activeSet === 'image');
  };

  const closeLightbox = () => {
    const closingController = activeController;
    const closingSet = activeSet;
    setGalleryFullscreenMode(false);
    exitGalleryFullscreen();
    pauseActiveLightboxVideo();
    lightbox.classList.remove('is-open', 'is-video-mode', 'is-image-mode');
    lightbox.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    lbStage.innerHTML = '';
    lbDots.innerHTML = '';
    if (lbCaption) lbCaption.textContent = '';
    if (lbNote) lbNote.textContent = '';
    if (lbSwitch) {
      lbSwitch.hidden = true;
      lbSwitch.setAttribute('aria-hidden', 'true');
    }
    activeController = null;
    activeSet = 'image';
    if (closingController) {
      closingController.render(closingSet);
      setPreviewPlaybackForLightbox(closingController, false);
    }
    teardownLightboxVideoPool();
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  const getItemsForSet = (controller, setName) => {
    if (!controller) return [];
    return setName === 'video' ? (controller.data.videos || []) : (controller.data.images || []);
  };

  const getCurrentIndex = (controller, setName) => controller.indices[setName] || 0;

  const setPreviewPlaybackForLightbox = (controller, paused) => {
    if (!controller || !controller.root) return;
    controller.root.querySelectorAll('.media-gallery__preview-video').forEach((previewVideo) => {
      try {
        if (paused) {
          previewVideo.pause();
          return;
        }
        const playPromise = previewVideo.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      } catch (err) {}
    });
  };

  const updatePreviewFromLightbox = () => {
    if (!activeController) return;
    if (lightbox.classList.contains('is-open')) return;
    activeController.render(activeSet);
  };

  const renderLightbox = () => {
    if (!activeController) return;
    const items = getItemsForSet(activeController, activeSet);
    if (!items.length) return;

    const currentIndex = getCurrentIndex(activeController, activeSet);
    const current = items[currentIndex];
    const ratio = activeController.root.style.getPropertyValue('--gallery-ratio') || '16 / 9';

    updateLightboxModeSwitch();
    lbViewport.style.setProperty('--lightbox-ratio', ratio);
    if (lbDialog) lbDialog.setAttribute('aria-label', activeController.data.title || 'TradingView preview gallery');
    if (lbCaption) lbCaption.textContent = current.label || activeController.data.title || 'TradingView preview';
    if (lbNote) lbNote.textContent = current.note || activeController.data.note || activeController.data.caption || 'See the exact workflow before you start.';

    const renderToken = ++activeLightboxRenderToken;
    const previousVideo = activeLightboxVideo;

    if (activeSet === 'video') {
      const pool = ensureLightboxVideoPool(activeController);
      primeLightboxVideoPool(activeController, currentIndex);

      const targetEntry = pool ? pool.get(current.src) : null;
      const previousEntry = (pool && activeLightboxVideoSrc) ? pool.get(activeLightboxVideoSrc) : null;

      if (!targetEntry) {
        pauseActiveLightboxVideo();
        lbStage.innerHTML = '';
      } else {
        const videoWrap = targetEntry.wrap;
        const video = targetEntry.video;
        const readyThreshold = getVideoReadyThreshold();
        let committed = false;

        const movePreviousBackToPool = () => {
          if (!previousEntry || previousEntry === targetEntry || !lightboxVideoPoolHost) return;
          resetLightboxVideoElement(previousEntry.video);
          if (previousEntry.wrap.parentNode !== lightboxVideoPoolHost) {
            lightboxVideoPoolHost.appendChild(previousEntry.wrap);
          }
        };

        const playVisibleVideo = () => {
          try { video.currentTime = 0; } catch (err) {}
          video.controls = true;
          video.setAttribute('controls', '');
          video.muted = true;
          video.defaultMuted = true;
          video.volume = 0;
          video.loop = true;
          video.autoplay = true;
          const playPromise = (() => {
            try { return video.play(); } catch (err) { return null; }
          })();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        };

        const finalizeSwap = () => {
          if (committed || renderToken !== activeLightboxRenderToken) return;
          committed = true;
          movePreviousBackToPool();
          if (videoWrap.parentNode && videoWrap.parentNode !== lbStage) {
            videoWrap.parentNode.removeChild(videoWrap);
          }
          lbStage.innerHTML = '';
          videoWrap.classList.add('is-video-ready');
          lbStage.appendChild(videoWrap);
          activeLightboxVideo = video;
          activeLightboxVideoSrc = current.src;
          playVisibleVideo();
          primeLightboxVideoPool(activeController, currentIndex + 1);
        };

        if (!video.dataset.azroFsBound) {
          video.dataset.azroFsBound = '1';
          video.addEventListener('webkitbeginfullscreen', () => setGalleryFullscreenMode(true));
          video.addEventListener('webkitendfullscreen', () => {
            if (!getFullscreenElement()) setGalleryFullscreenMode(false);
          });
        }

        if (video === previousVideo || targetEntry.primed || video.readyState >= 2) {
          finalizeSwap();
        } else {
          primeLightboxVideoEntry(targetEntry, true);
          const waitForReady = () => {
            if (renderToken !== activeLightboxRenderToken) return;
            const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
            if (targetEntry.primed || video.readyState >= 2 || currentTime >= readyThreshold) {
              finalizeSwap();
              return;
            }
            requestAnimationFrame(waitForReady);
          };
          waitForReady();
        }
      }
    } else {
      pauseActiveLightboxVideo();
      lbStage.innerHTML = '';
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

    setPreviewPlaybackForLightbox(controller, true);
    activeController = controller;
    activeSet = desiredSet;
    lastFocus = document.activeElement;
    setGalleryFullscreenMode(false);
    if (desiredSet === 'video') {
      ensureLightboxVideoPool(controller);
      primeLightboxVideoPool(controller, getCurrentIndex(controller, 'video'));
    }
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    lightbox.querySelector('.modal__close')?.focus();
  };

  lbModeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!activeController) return;
      const targetSet = btn.getAttribute('data-gallery-lightbox-set');
      if (!targetSet || targetSet === activeSet) return;
      const items = getItemsForSet(activeController, targetSet);
      if (!items.length) return;
      activeSet = targetSet;
      activeController.mode = targetSet;
      renderLightbox();
      updatePreviewFromLightbox();
    });
  });

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

  lbFullscreen?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleGalleryFullscreen();
  });

  lbStage?.addEventListener('click', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (activeSet !== 'image') return;
    if (!galleryFullscreenMode || isLightboxNativeFullscreen()) return;
    if (e.target.closest('button,video')) return;
    e.preventDefault();
    setGalleryFullscreenMode(false);
  });

  const handleGalleryFullscreenChange = () => {
    const videoNative = !!(activeLightboxVideo && activeLightboxVideo.webkitDisplayingFullscreen);
    if (isLightboxNativeFullscreen() || videoNative) {
      setGalleryFullscreenMode(true);
      return;
    }
    setGalleryFullscreenMode(false);
  };

  document.addEventListener('fullscreenchange', handleGalleryFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleGalleryFullscreenChange);

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      if (galleryFullscreenMode || isLightboxNativeFullscreen()) {
        e.preventDefault();
        setGalleryFullscreenMode(false);
        exitGalleryFullscreen();
        return;
      }
      closeLightbox();
      return;
    }
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
        launch.setAttribute('aria-label', `View ${this.data.title || 'preview media'}`);

        const allowPreviewAutoplay = root.getAttribute('data-preview-autoplay') === 'true';
        const isAboveFoldGallery = !!root.closest('.hero');
        let visual;
        if (modeKey === 'video') {
          const visualWrap = document.createElement('div');
          visualWrap.className = 'media-gallery__visual media-gallery__visual--video';

          const posterSrc = current.poster || (current.src && /\.mp4(?:[?#].*)?$/i.test(current.src)
            ? current.src.replace(/\.mp4((?:[?#].*)?)$/i, '-poster.webp$1')
            : current.src);
          if (allowPreviewAutoplay) {
            visualWrap.classList.add('media-gallery__visual--autoplay');
          } else {
            const poster = document.createElement('img');
            poster.className = 'media-gallery__poster media-gallery__poster--fallback';
            poster.src = posterSrc;
            poster.alt = current.label || this.data.title || 'Preview';
            poster.decoding = 'async';
            poster.loading = isAboveFoldGallery ? 'eager' : 'lazy';
            poster.setAttribute('fetchpriority', isAboveFoldGallery ? 'high' : 'auto');
            visualWrap.appendChild(poster);
          }

          if (allowPreviewAutoplay) {
            launch.classList.add('is-preview-playing');
            const video = document.createElement('video');
            video.className = 'media-gallery__preview-video';
            video.src = current.src;
            video.muted = true;
            video.defaultMuted = true;
            video.volume = 0;
            video.loop = true;
            video.autoplay = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.setAttribute('muted', '');
            video.setAttribute('loop', '');
            video.setAttribute('autoplay', '');
            video.setAttribute('aria-hidden', 'true');
            video.setAttribute('tabindex', '-1');
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            let previewReady = false;
            let playHasStarted = false;
            const needsExtraMobileGuard = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;
            const readyThreshold = needsExtraMobileGuard ? 0.12 : 0.03;
            const markReady = () => {
              if (previewReady) return;
              previewReady = true;
              visualWrap.classList.add('is-video-ready');
              launch.classList.add('is-preview-playing');
            };
            const clearReady = () => {
              previewReady = false;
              playHasStarted = false;
              visualWrap.classList.remove('is-video-ready');
              launch.classList.remove('is-preview-playing');
            };
            const revealWhenPainted = () => {
              if (previewReady || !playHasStarted) return;
              const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
              if (currentTime >= readyThreshold) {
                markReady();
                return;
              }
              if (typeof video.requestVideoFrameCallback === 'function') {
                video.requestVideoFrameCallback(() => {
                  if (!playHasStarted) return;
                  revealWhenPainted();
                });
                return;
              }
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (!playHasStarted) return;
                  revealWhenPainted();
                });
              });
            };
            const tryInlinePlay = () => {
              const playPromise = video.play();
              if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(() => {
                  playHasStarted = true;
                  revealWhenPainted();
                }).catch(() => {});
                return;
              }
            };
            const retryInlinePlay = () => {
              if (document.hidden) return;
              tryInlinePlay();
            };
            video.addEventListener('loadedmetadata', retryInlinePlay, { once: true });
            video.addEventListener('loadeddata', retryInlinePlay);
            video.addEventListener('canplay', retryInlinePlay);
            video.addEventListener('canplaythrough', retryInlinePlay);
            video.addEventListener('playing', () => {
              playHasStarted = true;
              revealWhenPainted();
            });
            video.addEventListener('timeupdate', () => {
              if (video.currentTime > 0) {
                playHasStarted = true;
                revealWhenPainted();
              }
            }, { once: true });
            video.addEventListener('pause', clearReady);
            video.addEventListener('error', clearReady);
            video.addEventListener('ended', retryInlinePlay);
            document.addEventListener('visibilitychange', retryInlinePlay, { once: true });
            document.addEventListener('pointerdown', retryInlinePlay, { once: true });
            window.addEventListener('focus', retryInlinePlay, { once: true });
            visualWrap.appendChild(video);
            video.load();
            requestAnimationFrame(retryInlinePlay);
            setTimeout(retryInlinePlay, 120);
          }

          visual = visualWrap;
        } else {
          const visualWrap = document.createElement('div');
          visualWrap.className = 'media-gallery__visual media-gallery__visual--image';

          const image = document.createElement('img');
          image.className = 'media-gallery__image';
          image.src = current.src;
          image.alt = current.alt || current.label || this.data.title || 'Preview';
          image.decoding = 'async';
          image.loading = isAboveFoldGallery ? 'eager' : 'lazy';
          image.setAttribute('fetchpriority', isAboveFoldGallery ? 'high' : 'auto');

          visualWrap.appendChild(image);
          visual = visualWrap;
        }

        const overlay = document.createElement('div');
        overlay.className = 'media-gallery__overlay';

        const action = document.createElement('span');
        action.className = 'media-gallery__launch-cta';
        action.textContent = 'View';

        launch.addEventListener('click', () => openLightbox(this, modeKey));
        overlay.append(action);
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

(() => {
  const pageLinks = Array.from(document.querySelectorAll('a[href]')).filter((anchor) => {
    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return false;
    if (anchor.target === '_blank') return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    return /(?:^|\/)[^?#]+\.html(?:#.*)?$/i.test(href);
  });
  if (!pageLinks.length) return;

  const closeOpenUi = () => {
    document.querySelectorAll('.modal.is-open').forEach((node) => {
      node.classList.remove('is-open');
      node.setAttribute('aria-hidden', 'true');
    });
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';

    const siteHeader = document.querySelector('.site-header');
    const navToggle = document.querySelector('.nav-toggle');
    if (siteHeader) siteHeader.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  };

  pageLinks.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref) return;

      let targetUrl;
      try {
        targetUrl = new URL(rawHref, window.location.href);
      } catch (err) {
        return;
      }

      if (targetUrl.origin !== window.location.origin) return;
      if (!/\.html$/i.test(targetUrl.pathname)) return;

      event.preventDefault();
      closeOpenUi();

      const currentUrl = new URL(window.location.href);
      const samePath = currentUrl.pathname === targetUrl.pathname;

      if (samePath && targetUrl.hash) {
        const id = decodeURIComponent(targetUrl.hash.slice(1));
        const target = document.getElementById(id);
        if (target) {
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', targetUrl.hash);
          } else {
            window.location.hash = targetUrl.hash;
          }
          requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          return;
        }
      }

      window.location.href = targetUrl.href;
    });
  });
})();

(() => {
  const supportOpeners = Array.from(document.querySelectorAll('[data-support-open]'));
  if (!supportOpeners.length) return;

  let modal = document.getElementById('supportInfoModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal modal--solid';
    modal.id = 'supportInfoModal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal__backdrop" data-modal-close=""></div>
      <div class="modal__dialog modal__dialog--support" role="dialog" aria-modal="true" aria-labelledby="supportModalTitle">
        <button class="modal__close" type="button" aria-label="Close" data-modal-close="">✕</button>
        <div class="support-modal__eyebrow"><span class="pill accent-blue">Direct support</span></div>
        <h2 id="supportModalTitle">Support email</h2>
        <p class="support-modal__lead">Use the email below for access issues, setup questions, alert troubleshooting, payment verification, or TradingView username changes.</p>
        <div class="support-modal__rows" aria-label="Support checklist">
          <div class="support-modal__row"><strong>Include</strong><span>TradingView username, symbol / timeframe, and a full chart screenshot when relevant.</span></div>
          <div class="support-modal__row"><strong>Reply window</strong><span>Support replies and product access are typically handled within 24 business hours or less.</span></div>
        </div>
        <div class="code-box support-modal__email"><code data-support-email="">support@azrosystems.com</code><button class="btn btn--sm btn--ghost" type="button" data-copy-support-email="">Copy email</button></div>
        <div class="modal__actions modal__actions--center support-modal__actions">
          <a class="btn btn--sm btn--ghost" href="support.html">Open support</a>
          <a class="btn btn--sm btn--ghost" href="resources.html">Open proof</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const closeOthers = () => {
    document.querySelectorAll('.modal.is-open').forEach((node) => {
      node.classList.remove('is-open');
      node.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  };

  const closeBtn = modal.querySelector('.modal__close');
  const closers = Array.from(modal.querySelectorAll('[data-modal-close]'));
  const copyBtn = modal.querySelector('[data-copy-support-email]');
  const emailEl = modal.querySelector('[data-support-email]');

  const openModal = (event) => {
    if (event) event.preventDefault();
    closeOthers();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = (event) => {
    if (event) event.preventDefault();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
    if (copyBtn) copyBtn.textContent = 'Copy email';
  };

  supportOpeners.forEach((node) => {
    node.addEventListener('click', openModal);
  });

  closers.forEach((node) => {
    node.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal(event);
    }
  });

  if (copyBtn && emailEl) {
    copyBtn.addEventListener('click', async () => {
      const email = (emailEl.textContent || '').trim();
      if (!email) return;
      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied';
      } catch (error) {
        const range = document.createRange();
        range.selectNodeContents(emailEl);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        try {
          document.execCommand('copy');
          copyBtn.textContent = 'Copied';
        } finally {
          selection.removeAllRanges();
        }
      }
      window.setTimeout(() => {
        copyBtn.textContent = 'Copy email';
      }, 1600);
    });
  }
})();

(() => {
  const grids = Array.from(document.querySelectorAll('.product-docs-grid--proof'));
  if (!grids.length) return;

  const updateGrid = (grid) => {
    const anyOpen = !!grid.querySelector('details[open]');
    grid.classList.toggle('has-open-doc', anyOpen);
  };

  grids.forEach((grid) => {
    const details = Array.from(grid.querySelectorAll('details'));
    details.forEach((item) => {
      item.addEventListener('toggle', () => updateGrid(grid));
    });
    updateGrid(grid);
  });

  window.addEventListener('load', () => {
    grids.forEach(updateGrid);
  });
})();

