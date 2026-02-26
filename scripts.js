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

    // --- Header fit (world-class): collapse into the hamburger menu
    // whenever the desktop nav would clip at common laptop widths.
    const nav = document.querySelector(".nav");
    const actions = document.querySelector(".topbar__actions");

    const computeHeaderFit = () => {
      // Remove the class so measurements reflect the full desktop layout.
      document.body.classList.remove("header--compact");

      // If CTAs are hidden by CSS (small screens), we always use the compact header.
      const actionsHidden = actions && window.getComputedStyle(actions).display === "none";
      let compact = !!actionsHidden;

      // If the nav would clip, switch to the compact header (hamburger).
      if (!compact && nav && window.getComputedStyle(nav).display !== "none") {
        compact = nav.scrollWidth > nav.clientWidth + 4;
      }

      document.body.classList.toggle("header--compact", compact);

      // If we're in desktop mode, ensure the mobile menu is closed.
      if (!compact) setOpen(false);
    };

    let resizeT = 0;
    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(computeHeaderFit, 60);
    };

    computeHeaderFit();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // Recompute after fonts load (font metrics can change nav width).
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => computeHeaderFit()).catch(() => {});
    }
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



  // --- Forward-to-finance (prewritten email with live links) ---
  const forwardLinks = document.querySelectorAll(".js-forward-finance");
  if (forwardLinks.length) {
    const base = window.location.origin && window.location.origin !== "null" ? window.location.origin : "";
    const abs = (p) => (base ? `${base}/${p}` : p);

    const subject = "AZRO Systems — BTC Treasury (policy + controls + reporting)";
    const body = [
      "Hi,",
      "",
      "Please review AZRO Systems' BTC Treasury program. It's policy-first, operations-first, and designed to be board-reviewable and audit-ready (no leverage, no derivatives, no ‘yield’ programs).",
      "",
      "Key artifacts:",
      `- Treasury Standard v1: ${abs("downloads/AZRO_Treasury_Standard_v1.pdf")}`,
      `- Controls checklist: ${abs("downloads/AZRO_Treasury_Controls_Checklist_v1.pdf")}`,
      `- Sample monthly BTC Treasury report: ${abs("downloads/AZRO_Sample_Monthly_BTC_Treasury_Report.pdf")}`,
      "",
      "Optional:",
      `- Board/CFO view (policy snapshot + reporting preview): ${abs("product.html?view=board#board")}`,
      `- Board packet generator: ${abs("board-packet.html")}`,
      `- Full documentation pack (ZIP): ${abs("downloads/AZRO_FINAL_DOCS_v8.zip")}`,
      "",
      "Thanks,",
      "",
    ].join("
");

    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    forwardLinks.forEach((a) => a.setAttribute("href", mailto));
  }
  // --- Mobile card tables (add data-labels from thead for CSS ::before labels) ---
  const cardTables = document.querySelectorAll("table.table--mobilecards");
  cardTables.forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
      (th.textContent || "").replace(/\s+/g, " ").trim()
    );
    if (!headers.length) return;

    table.querySelectorAll("tbody tr").forEach((tr) => {
      Array.from(tr.children).forEach((cell, idx) => {
        if (!cell || cell.nodeType !== 1) return;
        if (!cell.hasAttribute("data-label") && headers[idx]) {
          cell.setAttribute("data-label", headers[idx]);
        }
      });
    });
  });
})();
