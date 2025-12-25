/* ======================================================================
   AZRO Systems — Stable Fintech Landing (Modal + minimal UI)
   Goal: zero-glitch navigation, ultra-compatible modal (no <dialog>),
   and consistent behavior across devices.
   ====================================================================== */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ------------------------------------------------------------
  // Header polish (adds subtle shadow after scroll)
  // ------------------------------------------------------------
  const header = $(".site-header");
  if (header) {
    let ticking = false;
    const update = () => {
      ticking = false;
      header.classList.toggle("is-scrolled", (window.scrollY || 0) > 8);
    };
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  // ------------------------------------------------------------
  // Trial modal (static HTML on every page)
  // ------------------------------------------------------------
  const modal = $("[data-trial-modal]");
  const openers = $$("[data-open-trial]");
  if (modal && openers.length) {
    const panel = $(".trial-modal__panel", modal);
    const codeEl = $("[data-trial-code]", modal);
    const copyBtn = $("[data-copy-trial]", modal);
    const closers = $$("[data-close-trial]", modal);

    let lastActive = null;

    const lockScroll = (lock) => {
      document.documentElement.classList.toggle("is-modal-open", lock);
      document.body.classList.toggle("is-modal-open", lock);
    };

    const getFocusable = () =>
      $$(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        modal
      ).filter((el) => !el.hasAttribute("hidden"));

    const trapTab = (e) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusable();
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const openModal = () => {
      if (!modal.hidden) return;
      lastActive = document.activeElement;
      modal.hidden = false;
      lockScroll(true);

      // Focus the panel for keyboard users.
      window.setTimeout(() => {
        (panel || modal).focus?.();
      }, 0);
    };

    const closeModal = () => {
      if (modal.hidden) return;
      modal.hidden = true;
      lockScroll(false);

      if (lastActive && typeof lastActive.focus === "function") {
        lastActive.focus();
      }
      lastActive = null;
    };

    // Bind openers
    openers.forEach((btn) => {
      if (btn.dataset.azroBound === "1") return;
      btn.dataset.azroBound = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    });

    // Bind closers (X button, Done button, overlay)
    closers.forEach((el) => el.addEventListener("click", closeModal));

    // ESC + focus trap
    window.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") closeModal();
    });
    modal.addEventListener("keydown", trapTab);

    // Copy trial code
    if (copyBtn && codeEl) {
      copyBtn.addEventListener("click", async () => {
        const text = (codeEl.textContent || "").trim();
        if (!text) return;

        try {
          await navigator.clipboard.writeText(text);
          const old = copyBtn.textContent;
          copyBtn.textContent = "Copied";
          window.setTimeout(() => (copyBtn.textContent = old || "Copy"), 1200);
        } catch {
          // Fallback: select the code text for manual copy
          const range = document.createRange();
          range.selectNodeContents(codeEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }

    // Auto-open (?trial=1 or #trial)
    try {
      const url = new URL(window.location.href);
      const auto =
        url.searchParams.get("trial") === "1" ||
        window.location.hash.toLowerCase().includes("trial");
      if (auto) openModal();
    } catch {
      // ignore
    }
  }

  // ------------------------------------------------------------
  // About page: optional fullscreen video on click (safe)
  // ------------------------------------------------------------
  const fsVid = $(".js-video-fullscreen");
  if (fsVid) {
    fsVid.addEventListener("click", () => {
      const doc = document;
      if (doc.fullscreenElement && doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
        return;
      }

      const any = fsVid;
      const req =
        any.requestFullscreen ||
        any.webkitRequestFullscreen ||
        any.mozRequestFullScreen ||
        any.msRequestFullscreen;

      if (req) {
        try {
          req.call(any);
        } catch {
          // ignore
        }
      }
    });
  }
})();
