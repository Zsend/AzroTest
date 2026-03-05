/* AZRO Systems — minimal site JS */

// Mobile nav
(() => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');

  if (!navToggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('is-open')) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (nav.contains(target) || navToggle.contains(target)) return;
    closeNav();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // Close after selecting a link (mobile UX)
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => closeNav());
  });
})();

// Trial modal
(() => {
  const modal = document.getElementById('trialModal');
  if (!modal) return;

  const openers = Array.from(document.querySelectorAll('[data-trial-open]'));
  const closers = Array.from(modal.querySelectorAll('[data-modal-close]'));
  const copyBtn = modal.querySelector('[data-copy-code]');
  const codeEl = modal.querySelector('#trialCode');

  const open = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
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
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  if (copyBtn && codeEl) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeEl.textContent.trim());
        copyBtn.textContent = 'Copied';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1400);
      } catch (_err) {
        // Fallback: select text
        const range = document.createRange();
        range.selectNodeContents(codeEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }
})();

// Preview tabs (Home/About hero)
(() => {
  const cards = Array.from(document.querySelectorAll('[data-preview]'));
  if (!cards.length) return;

  cards.forEach((card) => {
    const tabs = Array.from(card.querySelectorAll('[data-preview-tab]'));
    const panels = Array.from(card.querySelectorAll('[data-preview-panel]'));
    const notes = Array.from(card.querySelectorAll('[data-preview-note]'));

    if (!tabs.length || !panels.length) return;

    const setActive = (key) => {
      tabs.forEach((t) => {
        const isActive = t.getAttribute('data-preview-tab') === key;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });

      panels.forEach((p) => {
        const isActive = p.getAttribute('data-preview-panel') === key;
        p.classList.toggle('is-active', isActive);
        if (isActive) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });

      notes.forEach((n) => {
        const isActive = n.getAttribute('data-preview-note') === key;
        if (isActive) n.removeAttribute('hidden');
        else n.setAttribute('hidden', '');
      });
    };

    tabs.forEach((t) => {
      t.addEventListener('click', () => {
        const key = t.getAttribute('data-preview-tab');
        if (!key) return;
        setActive(key);
      });
    });
  });
})();

// Accordion: keep only one <details> open at a time (per accordion)
(() => {
  const accordions = Array.from(document.querySelectorAll('.accordion'));
  if (!accordions.length) return;

  accordions.forEach((acc) => {
    const items = Array.from(acc.querySelectorAll('details'));
    if (items.length <= 1) return;

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

// Label / video modal (About page)
(() => {
  const modal = document.getElementById('labelModal');
  if (!modal) return;

  const video = modal.querySelector('video');
  const titleEl = modal.querySelector('[data-label-title]');
  const descEl = modal.querySelector('[data-label-desc]');
  const openers = Array.from(document.querySelectorAll('[data-label-open]'));
  const closers = Array.from(modal.querySelectorAll('[data-modal-close]'));

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    if (video) {
      try { video.pause(); } catch (_) {}
      video.removeAttribute('src');
      video.removeAttribute('poster');
      video.load();
    }
  };

  const open = (btn) => {
    const explicitTitle = btn.getAttribute('data-title') || btn.getAttribute('data-label-title');
    const explicitDesc = btn.getAttribute('data-desc') || btn.getAttribute('data-label-desc');
    const src = btn.getAttribute('data-video');
    const poster = btn.getAttribute('data-poster');
    const loopAttr = btn.getAttribute('data-loop');
    const loop = loopAttr == null ? true : !(loopAttr === 'false' || loopAttr === '0');

    const container = btn.closest('.label-card') || btn.closest('details') || btn.closest('[data-label-container]');
    const fallbackTitle =
      (container && (container.querySelector('.label-name') || container.querySelector('h3,h4') || container.querySelector('summary'))?.textContent.trim()) ||
      'Example';

    const fallbackDesc =
      (container && (container.querySelector('[data-label-text]') || container.querySelector('p'))?.textContent.trim()) ||
      '';

    const title = explicitTitle || fallbackTitle;
    const desc = explicitDesc || fallbackDesc;

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    if (video && src) {
      // Reset + load
      try { video.pause(); } catch (_) {}
      video.loop = loop;
      video.muted = true;
      if (poster) video.poster = poster;
      else video.removeAttribute('poster');

      video.src = src;
      video.load();

      const tryPlay = () => {
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      };

      // Try immediately (most browsers allow because this is in a user gesture)
      tryPlay();

      // Try again once ready (helps reduce “paused frame” feel)
      const onCanPlay = () => {
        tryPlay();
        video.removeEventListener('canplay', onCanPlay);
      };
      video.addEventListener('canplay', onCanPlay);
    }

    const closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
  };

  openers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      open(btn);
    });
  });

  closers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();
