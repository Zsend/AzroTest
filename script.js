/* ============================================================
   AZRO Systems — Trial Modal + Minimal UI Helpers
   Goal: maximum stability (no frameworks, no heavy observers).
   ============================================================ */

(() => {
  const TRIAL_CODE = "AZROFREE";

  const modal = document.querySelector("[data-trial-modal]");
  if (!modal) return;

  const openers = Array.from(document.querySelectorAll("[data-open-trial]"));
  const closers = Array.from(modal.querySelectorAll("[data-close-trial]"));
  const overlay = modal.querySelector("[data-close-trial].trial-modal__overlay") || modal.querySelector(".trial-modal__overlay");
  const copyBtn = modal.querySelector("[data-copy-trial]");
  const codeEl = modal.querySelector("[data-trial-code]");

  let lastActive = null;

  function lockScroll(lock) {
    document.documentElement.classList.toggle("is-modal-open", lock);
    document.body.classList.toggle("is-modal-open", lock);
  }

  function getFocusable() {
    return Array.from(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("hidden"));
  }

  function trapTab(e) {
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
  }

  function openModal() {
    if (!modal.hidden) return;
    lastActive = document.activeElement;
    modal.hidden = false;
    lockScroll(true);

    // Small delay so CSS transitions can apply before focus.
    window.setTimeout(() => {
      const focusables = getFocusable();
      (focusables[0] || modal).focus?.();
    }, 0);
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    lockScroll(false);
    if (lastActive && typeof lastActive.focus === "function") {
      lastActive.focus();
    }
    lastActive = null;
  }

  // Openers
  openers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  // Closers
  closers.forEach((btn) => btn.addEventListener("click", closeModal));
  if (overlay) overlay.addEventListener("click", closeModal);

  // ESC + focus trap
  window.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") closeModal();
  });
  modal.addEventListener("keydown", trapTab);

  // Copy trial code
  if (copyBtn && codeEl) {
    copyBtn.addEventListener("click", async () => {
      const text = codeEl.textContent?.trim() || TRIAL_CODE;
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
  const url = new URL(window.location.href);
  const auto =
    (url.searchParams.get("trial") === "1") ||
    window.location.hash.toLowerCase().includes("trial");
  if (auto) openModal();
})();
