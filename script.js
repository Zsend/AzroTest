// AZRO Systems — Minimal, stable JS (no dependencies)
// Goals: zero glitches, fast navigation, and accessibility.
// Features:
// - Copy-to-clipboard buttons (with safe fallback)
// - Mobile menu (hamburger): scroll lock + focus trap + Escape + overlay close
// - Layout vars: set CSS custom properties for header / sticky CTA heights (prevents overlaps)

(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;

  function copyText(text) {
    if (!text) return Promise.reject(new Error('No text'));
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('Copy failed'));
      } catch (e) {
        reject(e);
      }
    });
  }

  function initCopyButtons() {
    var btns = document.querySelectorAll('[data-copy]');
    if (!btns || !btns.length) return;

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy-text');
        var targetId = btn.getAttribute('data-copy-target');
        if (!text && targetId) {
          var el = document.getElementById(targetId);
          if (el) text = (el.textContent || '').trim();
        }

        var original = btn.textContent;
        copyText((text || '').trim())
          .then(function () {
            btn.textContent = 'Copied';
            btn.setAttribute('aria-live', 'polite');
            setTimeout(function () { btn.textContent = original; }, 1200);
          })
          .catch(function () {
            btn.textContent = 'Copy failed';
            setTimeout(function () { btn.textContent = original; }, 1400);
          });
      });
    });
  }

  // --- Layout vars (prevents sticky overlaps & docs-nav clipping) ---
  var _layoutRaf = 0;
  function setLayoutVars() {
    _layoutRaf = 0;

    var header = document.querySelector('.site-header');
    if (header) {
      var hh = Math.round(header.getBoundingClientRect().height);
      if (hh > 0) root.style.setProperty('--headerH', hh + 'px');
    }

    var sticky = document.querySelector('.sticky-cta');
    if (sticky) {
      // Height is 0 when display:none (desktop) — that's fine.
      var sh = Math.round(sticky.getBoundingClientRect().height);
      if (sh > 0) {
        root.style.setProperty('--stickyBarH', sh + 'px');
      }
    }
  }

  function scheduleLayoutVars() {
    if (_layoutRaf) cancelAnimationFrame(_layoutRaf);
    _layoutRaf = requestAnimationFrame(setLayoutVars);
  }

  // --- Mobile menu (hamburger) ---
  function initMobileMenu() {
    var btn = document.querySelector('[data-menu-button]');
    var menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    var overlay = menu.querySelector('[data-menu-overlay]');
    var closeBtn = menu.querySelector('[data-menu-close]');
    var panel = menu.querySelector('.mobile-menu__panel');

    var lastFocus = null;
    var scrollY = 0;

    function lockScroll() {
      scrollY = window.scrollY || window.pageYOffset || 0;
      // iOS-friendly scroll lock
      body.style.position = 'fixed';
      body.style.top = (-scrollY) + 'px';
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
    }

    function unlockScroll() {
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      window.scrollTo(0, scrollY);
    }

    function getFocusable() {
      if (!panel) return [];
      return panel.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
    }

    function focusFirst() {
      var focusables = getFocusable();
      if (focusables && focusables.length) {
        focusables[0].focus();
      } else if (closeBtn) {
        closeBtn.focus();
      } else {
        btn.focus();
      }
    }

    function openMenu() {
      if (!menu.hasAttribute('hidden')) return;

      lastFocus = document.activeElement;
      menu.removeAttribute('hidden');
      body.classList.add('is-menu-open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');

      lockScroll();

      // Ensure layout vars are accurate (header height can vary slightly per breakpoint)
      scheduleLayoutVars();

      // Move focus into the dialog
      setTimeout(focusFirst, 0);
    }

    function closeMenu() {
      if (menu.hasAttribute('hidden')) return;

      menu.setAttribute('hidden', '');
      body.classList.remove('is-menu-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');

      unlockScroll();

      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      } else {
        btn.focus();
      }
    }

    function toggleMenu() {
      if (menu.hasAttribute('hidden')) openMenu();
      else closeMenu();
    }

    // Focus trap
    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeMenu();
        return;
      }
      if (e.key !== 'Tab') return;
      if (menu.hasAttribute('hidden')) return;

      var focusables = getFocusable();
      if (!focusables || !focusables.length) return;

      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    btn.addEventListener('click', function () {
      toggleMenu();
    });

    if (overlay) {
      overlay.addEventListener('click', function () {
        closeMenu();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeMenu();
      });
    }

    // Close when clicking a link inside the menu (navigation)
    menu.addEventListener('click', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.tagName === 'A') closeMenu();
    });

    document.addEventListener('keydown', onKeydown);

    // If viewport grows to desktop, ensure menu closes (prevents weird states)
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1100) closeMenu();
    });

    // Ensure correct initial attributes
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
  }

  function init() {
    initCopyButtons();
    initMobileMenu();
    setLayoutVars();
    window.addEventListener('resize', scheduleLayoutVars, { passive: true });
    window.addEventListener('orientationchange', scheduleLayoutVars, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
