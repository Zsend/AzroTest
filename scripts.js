/* AZRO site behavior: mobile nav + view switching + tiny quality-of-life helpers */
(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // --- Mobile nav (locks body scroll when open) ---
  const toggle = document.querySelector(".navtoggle");
  const menu = document.querySelector(".mobilemenu");
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.hidden = !open;
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };

    setOpen(false);

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!isOpen);
    });

    // Close on link click
    menu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) setOpen(false);
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    // Ensure the menu can't get stuck open across breakpoints
    // Keep in sync with the CSS topbar breakpoint.
    const mq = window.matchMedia("(min-width: 1181px)");
    const handleMq = () => {
      if (mq.matches) setOpen(false);
    };
    if (mq.addEventListener) mq.addEventListener("change", handleMq);
    else mq.addListener(handleMq);
  }

  // --- Accordion (optional: only one open at a time) ---
  const accordions = document.querySelectorAll("[data-accordion]");
  accordions.forEach((acc) => {
    const items = acc.querySelectorAll("details");
    items.forEach((d) => {
      d.addEventListener("toggle", () => {
        if (!d.open) return;
        items.forEach((other) => {
          if (other !== d) other.open = false;
        });
      });
    });
  });

  // --- View switching (Owner overview vs Board/CFO view) ---
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const normalizeView = (v) => (String(v || "").toLowerCase() === "board" ? "board" : "owner");

  const body = document.body;
  const triggers = Array.from(document.querySelectorAll("[data-set-view]"));
  const boardFold = document.getElementById("board-fold");

  const updateTriggerState = (view) => {
    triggers.forEach((btn) => {
      const isActive = btn.getAttribute("data-set-view") === view;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const setView = (view, opts = {}) => {
    const v = normalizeView(view);
    body.setAttribute("data-view", v);

    try {
      localStorage.setItem("azro_view", v);
    } catch (_) {}

    updateTriggerState(v);

    if (boardFold) boardFold.open = v === "board";

    const sel = opts.scrollSel;
    if (sel) {
      const el = document.querySelector(sel);
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      }
    }
  };

  const getInitialView = () => {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get("view") || url.searchParams.get("audience");
      if (q) return normalizeView(q);
    } catch (_) {}

    if ((window.location.hash || "").toLowerCase() === "#board") return "board";

    try {
      const stored = localStorage.getItem("azro_view");
      if (stored) return normalizeView(stored);
    } catch (_) {}

    return "owner";
  };

  // Initialize
  setView(getInitialView());

  // Button-driven switching (used in hero)
  triggers.forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-set-view");
      const target = btn.getAttribute("data-scroll");
      setView(v, { scrollSel: target || undefined });
    });
  });

  // If someone navigates directly to #board, ensure Board/CFO view is open
  window.addEventListener("hashchange", () => {
    if ((window.location.hash || "").toLowerCase() === "#board") setView("board");
  });

  // If someone clicks an anchor to #board, open the fold (do not override the anchor scroll)
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#board"]');
    if (!a) return;
    setView("board");
  });
})();
