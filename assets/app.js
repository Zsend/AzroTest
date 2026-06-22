(() => {
  "use strict";

  document.documentElement.classList.add("app-ready");

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const menuButton = q("[data-menu-toggle]");
  const siteNav = q("[data-site-nav]");

  function closeMenu() {
    if (!menuButton || !siteNav) return;
    menuButton.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("open");
    document.body.classList.remove("menu-open");
  }

  if (menuButton && siteNav) {
    menuButton.addEventListener("click", () => {
      const opening = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(opening));
      siteNav.classList.toggle("open", opening);
      document.body.classList.toggle("menu-open", opening);
    });

    qa("a", siteNav).forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  qa("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const reveals = qa(".reveal");
  if (reveals.length) {
    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
      reveals.forEach((node) => observer.observe(node));
    } else {
      reveals.forEach((node) => node.classList.add("is-visible"));
    }
  }

  function renderChart(host) {
    const data = window.PROHIBITION_CAREERS_DATA?.federalMarijuanaCases;
    if (!host || !Array.isArray(data) || !data.length) return;

    const compact = host.getBoundingClientRect().width < 560;
    const width = compact ? 390 : 920;
    const height = compact ? 300 : 330;
    const margin = compact
      ? { top: 38, right: 20, bottom: 44, left: 44 }
      : { top: 42, right: 44, bottom: 52, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const max = 1100;
    const min = 0;
    const x = (index) => margin.left + (innerW * index) / (data.length - 1);
    const y = (value) => margin.top + innerH - ((value - min) / (max - min)) * innerH;
    const pts = data.map((d, index) => ({ x: x(index), y: y(d.value), ...d }));

    const smoothPath = (points) => {
      if (points.length < 2) return "";
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return d;
    };

    const linePath = smoothPath(pts);
    const areaPath = `${linePath} L ${pts.at(-1).x} ${margin.top + innerH} L ${pts[0].x} ${margin.top + innerH} Z`;
    const ns = "http://www.w3.org/2000/svg";
    const make = (name, attributes = {}) => {
      const node = document.createElementNS(ns, name);
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
      return node;
    };

    const svg = make("svg", {
      viewBox: `0 0 ${width} ${height}`,
      class: "trend-chart",
      role: "img",
      "aria-labelledby": "federal-chart-title federal-chart-desc"
    });

    const title = make("title", { id: "federal-chart-title" });
    title.textContent = "Federal marijuana trafficking cases sentenced, fiscal years 2021 through 2025";
    svg.appendChild(title);

    const desc = make("desc", { id: "federal-chart-desc" });
    desc.textContent = "Cases declined from 995 in fiscal year 2021 to 383 in fiscal year 2025.";
    svg.appendChild(desc);

    const defs = make("defs");
    const lineGradient = make("linearGradient", { id: "trend-line", x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
    [["0%", "#B65F3C"], ["52%", "#E4B44B"], ["100%", "#97AD88"]].forEach(([offset, color]) => {
      lineGradient.appendChild(make("stop", { offset, "stop-color": color }));
    });
    const areaGradient = make("linearGradient", { id: "trend-area", x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
    areaGradient.appendChild(make("stop", { offset: "0%", "stop-color": "#E4B44B", "stop-opacity": ".16" }));
    areaGradient.appendChild(make("stop", { offset: "100%", "stop-color": "#97AD88", "stop-opacity": "0" }));
    defs.append(lineGradient, areaGradient);
    svg.appendChild(defs);

    (compact ? [0, 500, 1000] : [0, 250, 500, 750, 1000]).forEach((tick) => {
      svg.appendChild(make("line", {
        x1: margin.left,
        x2: width - margin.right,
        y1: y(tick),
        y2: y(tick),
        stroke: "rgba(199,193,182,.13)",
        "stroke-width": 1
      }));
      const label = make("text", {
        x: margin.left - 15,
        y: y(tick) + 5,
        "text-anchor": "end",
        fill: "rgba(242,236,224,.46)",
        "font-size": compact ? 11 : 13
      });
      label.textContent = String(tick);
      svg.appendChild(label);
    });

    svg.appendChild(make("path", { d: areaPath, fill: "url(#trend-area)" }));
    svg.appendChild(make("path", {
      d: linePath,
      fill: "none",
      stroke: "url(#trend-line)",
      "stroke-width": compact ? 4 : 5,
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    }));

    pts.forEach((point, index) => {
      const pointColor = index === 0 ? "#B65F3C" : index === pts.length - 1 ? "#97AD88" : "#E4B44B";
      svg.appendChild(make("circle", { cx: point.x, cy: point.y, r: compact ? 9 : 12, fill: pointColor, opacity: .11 }));
      svg.appendChild(make("circle", { cx: point.x, cy: point.y, r: compact ? 4.5 : 5.5, fill: pointColor }));

      const value = make("text", {
        x: point.x,
        y: point.y - 19,
        "text-anchor": "middle",
        fill: "#FFFDF8",
        "font-size": compact ? 12 : 17,
        "font-weight": 800
      });
      value.textContent = point.value.toLocaleString("en-US");
      svg.appendChild(value);

      const year = make("text", {
        x: point.x,
        y: height - 18,
        "text-anchor": "middle",
        fill: "rgba(242,236,224,.58)",
        "font-size": compact ? 11 : 14
      });
      year.textContent = point.year;
      svg.appendChild(year);
    });

    host.replaceChildren(svg);
  }

  qa("[data-trend-chart]").forEach(renderChart);

  const tabs = qa("[data-tab]");
  const panels = qa("[data-panel]");

  function activatePath(name, focus = false) {
    if (!tabs.length || !panels.length) return;
    const valid = tabs.some((tab) => tab.dataset.tab === name) ? name : "candidate";
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === valid;
      tab.setAttribute("aria-selected", String(active));
      tab.setAttribute("tabindex", active ? "0" : "-1");
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => {
      const active = panel.dataset.panel === valid;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  }

  if (tabs.length) {
    const requested = new URLSearchParams(window.location.search).get("path") || window.location.hash.replace("#", "");
    activatePath(requested || "candidate");

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activatePath(tab.dataset.tab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        activatePath(tabs[next].dataset.tab, true);
      });
    });
  }

  const clean = (value) => String(value || "").replace(/\r\n?/g, "\n").trim();

  function formatForm(form) {
    const path = form.dataset.path || "Network";
    const subject = `${path} — Prohibition Careers`;
    const lines = [
      `PROHIBITION CAREERS — ${path.toUpperCase()}`,
      "",
      "This message was prepared on prohibitioncareers.com.",
      ""
    ];

    qa("[data-label]", form).forEach((field) => {
      let value = "";
      if (field.type === "checkbox") value = field.checked ? "Yes" : "No";
      else value = clean(field.value);
      if (!value) return;
      lines.push(`${field.dataset.label}:`);
      lines.push(value);
      lines.push("");
    });

    lines.push("I understand that joining the network does not guarantee contact, referral, an interview, or employment.");
    return { subject, body: lines.join("\n") };
  }

  qa("[data-email-form]").forEach((form) => {
    const preview = q("[data-message-preview]", form.closest("[data-panel]") || document);
    const messageText = preview ? q("[data-message-text]", preview) : null;
    const mailLink = preview ? q("[data-mail-link]", preview) : null;
    const copyButton = preview ? q("[data-copy-message]", preview) : null;
    const copyStatus = preview ? q("[data-copy-status]", preview) : null;
    let latest = "";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const message = formatForm(form);
      latest = `Subject: ${message.subject}\n\n${message.body}`;
      if (messageText) messageText.textContent = latest;
      if (mailLink) {
        mailLink.href = `mailto:support@prohibitioncareers.com?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`;
      }
      if (preview) {
        preview.classList.add("visible");
        preview.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
      }
      if (copyStatus) copyStatus.textContent = "";
    });

    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        if (!latest) return;
        try {
          await navigator.clipboard.writeText(latest);
          if (copyStatus) copyStatus.textContent = "Message copied.";
        } catch (_error) {
          const area = document.createElement("textarea");
          area.value = latest;
          area.setAttribute("readonly", "");
          area.className = "clipboard-fallback";
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          area.remove();
          if (copyStatus) copyStatus.textContent = "Message copied.";
        }
      });
    }
  });

  qa("[data-share]").forEach((button) => {
    button.addEventListener("click", async () => {
      const payload = {
        title: "Prohibition Careers",
        text: "The industry moved forward. Careers should too.",
        url: window.PROHIBITION_CAREERS_DATA?.siteUrl || "https://zsend.github.io/AzroTest"
      };
      try {
        if (navigator.share) await navigator.share(payload);
        else {
          await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
          const original = button.textContent;
          button.textContent = "Link copied";
          setTimeout(() => { button.textContent = original; }, 1800);
        }
      } catch (error) {
        if (error?.name !== "AbortError") window.location.href = `mailto:?subject=${encodeURIComponent(payload.title)}&body=${encodeURIComponent(`${payload.text}\n\n${payload.url}`)}`;
      }
    });
  });
})();
