/* ======================================================================
   AZRO Systems — Modern Fintech Build (2025-12-23)
   Purpose: keep behavior fast, minimal, and consistent across pages.
   ====================================================================== */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ------------------------------------------------------------
  // Sticky header polish (adds subtle shadow after scroll)
  // ------------------------------------------------------------
  const header = $(".site-header");
  if (header) {
    let ticking = false;
    const update = () => {
      ticking = false;
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  // ------------------------------------------------------------
  // Sticky CTA padding (prevents content being covered on mobile)
  // ------------------------------------------------------------
  const sticky = $('[data-sticky-cta]');
  const setCtaVar = () => {
    const h = sticky && getComputedStyle(sticky).display !== "none"
      ? Math.ceil(sticky.getBoundingClientRect().height)
      : 0;
    document.documentElement.style.setProperty("--cta-bottom-h", `${h}px`);
  };

  if (sticky && "ResizeObserver" in window) {
    const ro = new ResizeObserver(() => setCtaVar());
    ro.observe(sticky);
    window.addEventListener("resize", setCtaVar, { passive: true });
    window.addEventListener("orientationchange", setCtaVar, { passive: true });
    setCtaVar();
  } else {
    window.addEventListener("load", setCtaVar, { passive: true });
    window.addEventListener("resize", setCtaVar, { passive: true });
    window.addEventListener("orientationchange", setCtaVar, { passive: true });
    setCtaVar();
  }

  // ------------------------------------------------------------
  // Trial modal (global)
  // ------------------------------------------------------------
  const TRIAL_CODE = "AZROFREE";
  const TRIAL_URL = "https://azrosystems.gumroad.com/l/kuvbu";

  function ensureTrialModal() {
    let dlg = $("#azroTrialModal");
    if (dlg) return dlg;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <dialog class="azro-modal" id="azroTrialModal" aria-labelledby="trialTitle">
        <form method="dialog">
          <div class="azro-modal__head">
            <div>
              <h3 class="azro-modal__title" id="trialTitle">Free trial</h3>
              <p class="azro-modal__sub">Use this code at checkout (Gumroad) for free access.</p>
            </div>
            <button class="azro-modal__close" value="close" aria-label="Close">Close</button>
          </div>

          <div class="azro-modal__scroll">
            <div class="azro-modal__body">
              <div class="azro-modal__text">
                <span class="azro-pill">Trial code</span>
                <div class="trial-code">
                  <code id="trialCode" aria-label="Trial code">${TRIAL_CODE}</code>
                  <button class="azro-modal__copy" type="button" data-copy-code>Copy</button>
                </div>
                <p class="azro-modal__muted">
                  After checkout, submit your TradingView username so we can grant invite-only access.
                </p>
                <div class="cta-row" style="justify-content:center; margin-top: 12px;">
                  <a class="btn btn--primary" href="${TRIAL_URL}" rel="noopener noreferrer" target="_blank">Open checkout</a>
                </div>
                <ul class="trial-steps-tight">
                  <li>Paste the code at Gumroad checkout.</li>
                  <li>Complete checkout (code makes it free).</li>
                  <li>Submit your TradingView username.</li>
                  <li>We grant access to the private indicator.</li>
                </ul>
              </div>

              <div class="azro-modal__media">
                <div class="azro-video" role="region" aria-label="What happens next">
                  <div class="azro-video__ph">
                    You’ll receive private access to the TradingView® script after purchase/trial redemption.
                    <br><br>
                    Need help? Email <a href="mailto:support@azrosystems.com" style="text-decoration:underline; text-underline-offset:2px;">support@azrosystems.com</a>.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="azro-modal__foot">
            <span><strong>Invite-only TradingView® indicator</strong> • educational tool, not financial advice</span>
            <button class="azro-modal__close" value="close">Done</button>
          </div>
        </form>
      </dialog>
    `.trim();

    dlg = wrapper.firstElementChild;
    document.body.appendChild(dlg);

    // Copy behavior
    const copyBtn = $('[data-copy-code]', dlg);
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(TRIAL_CODE);
          copyBtn.textContent = "Copied";
          window.setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
        } catch {
          // Fallback
          const range = document.createRange();
          const codeEl = $("#trialCode", dlg);
          if (codeEl) {
            range.selectNodeContents(codeEl);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      });
    }

    // Prevent background scroll on iOS while open
    dlg.addEventListener("close", () => {
      document.documentElement.classList.remove("azr-modal-open");
    });
    dlg.addEventListener("cancel", () => {
      document.documentElement.classList.remove("azr-modal-open");
    });

    return dlg;
  }

  function safeShowModal(dlg) {
    if (!dlg) return;
    try {
      if (typeof dlg.showModal === "function") {
        document.documentElement.classList.add("azr-modal-open");
        dlg.showModal();
      } else {
        // Fallback: navigate user to checkout with code visible in URL hash
        window.location.href = TRIAL_URL;
      }
    } catch {
      window.location.href = TRIAL_URL;
    }
  }

  function bindTrialOpeners() {
    const openers = $$("[data-open-trial]");
    if (!openers.length) return;

    openers.forEach((btn) => {
      if (btn.dataset.azrBound === "1") return;
      btn.dataset.azrBound = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const dlg = ensureTrialModal();
        safeShowModal(dlg);
      });
    });
  }

  bindTrialOpeners();

  // Auto-open if URL contains #trial or ?trial=1
  const url = new URL(window.location.href);
  const shouldAuto =
    window.location.hash.toLowerCase().includes("trial") ||
    url.searchParams.get("trial") === "1";
  if (shouldAuto) {
    const dlg = ensureTrialModal();
    safeShowModal(dlg);
  }

  // ------------------------------------------------------------
  // About page: fullscreen video on click (single handler, no touch duplicates)
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

      try {
        if (req) {
          req.call(any);
        } else if (typeof any.webkitEnterFullscreen === "function") {
          // iOS Safari video fullscreen
          any.webkitEnterFullscreen();
        }
      } catch {
        // ignore
      }
    });
  }
})();
