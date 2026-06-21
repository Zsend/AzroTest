(() => {
  "use strict";

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

    const width = 900;
    const height = 320;
    const margin = { top: 35, right: 42, bottom: 52, left: 58 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const max = 1100;
    const min = 0;
    const x = (index) => margin.left + (innerW * index) / (data.length - 1);
    const y = (value) => margin.top + innerH - ((value - min) / (max - min)) * innerH;
    const points = data.map((d, index) => `${x(index)},${y(d.value)}`).join(" ");
    const area = `${margin.left},${margin.top + innerH} ${points} ${x(data.length - 1)},${margin.top + innerH}`;

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", "trend-chart");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-labelledby", "federal-chart-title federal-chart-desc");

    const title = document.createElementNS(ns, "title");
    title.setAttribute("id", "federal-chart-title");
    title.textContent = "Federal marijuana trafficking cases sentenced, fiscal years 2021 through 2025";
    svg.appendChild(title);

    const desc = document.createElementNS(ns, "desc");
    desc.setAttribute("id", "federal-chart-desc");
    desc.textContent = "Cases declined from 995 in fiscal year 2021 to 383 in fiscal year 2025.";
    svg.appendChild(desc);

    [0, 250, 500, 750, 1000].forEach((tick) => {
      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", String(margin.left));
      line.setAttribute("x2", String(width - margin.right));
      line.setAttribute("y1", String(y(tick)));
      line.setAttribute("y2", String(y(tick)));
      line.setAttribute("stroke", "rgba(255,255,255,.11)");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);

      const label = document.createElementNS(ns, "text");
      label.setAttribute("x", String(margin.left - 15));
      label.setAttribute("y", String(y(tick) + 5));
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "rgba(255,255,255,.48)");
      label.setAttribute("font-size", "13");
      label.textContent = String(tick);
      svg.appendChild(label);
    });

    const areaShape = document.createElementNS(ns, "polygon");
    areaShape.setAttribute("points", area);
    areaShape.setAttribute("fill", "rgba(242,196,95,.08)");
    svg.appendChild(areaShape);

    const lineShape = document.createElementNS(ns, "polyline");
    lineShape.setAttribute("points", points);
    lineShape.setAttribute("fill", "none");
    lineShape.setAttribute("stroke", "#f2c45f");
    lineShape.setAttribute("stroke-width", "5");
    lineShape.setAttribute("stroke-linecap", "round");
    lineShape.setAttribute("stroke-linejoin", "round");
    svg.appendChild(lineShape);

    data.forEach((d, index) => {
      const cx = x(index);
      const cy = y(d.value);

      const halo = document.createElementNS(ns, "circle");
      halo.setAttribute("cx", String(cx));
      halo.setAttribute("cy", String(cy));
      halo.setAttribute("r", "12");
      halo.setAttribute("fill", "rgba(242,196,95,.13)");
      svg.appendChild(halo);

      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", String(cx));
      dot.setAttribute("cy", String(cy));
      dot.setAttribute("r", "5.5");
      dot.setAttribute("fill", "#f2c45f");
      svg.appendChild(dot);

      const value = document.createElementNS(ns, "text");
      value.setAttribute("x", String(cx));
      value.setAttribute("y", String(cy - 19));
      value.setAttribute("text-anchor", "middle");
      value.setAttribute("fill", "#fff");
      value.setAttribute("font-size", "17");
      value.setAttribute("font-weight", "800");
      value.textContent = d.value.toLocaleString("en-US");
      svg.appendChild(value);

      const year = document.createElementNS(ns, "text");
      year.setAttribute("x", String(cx));
      year.setAttribute("y", String(height - 18));
      year.setAttribute("text-anchor", "middle");
      year.setAttribute("fill", "rgba(255,255,255,.58)");
      year.setAttribute("font-size", "14");
      year.textContent = d.year;
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
        url: window.PROHIBITION_CAREERS_DATA?.siteUrl || "https://prohibitioncareers.com"
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
