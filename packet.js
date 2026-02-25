/* Board packet generator (client-only). Prints a board-ready packet via the browser print dialog. */
(function () {
  const form = document.getElementById("packetForm");
  if (!form) return;

  const outEls = Array.from(document.querySelectorAll("[data-out]"));
  const byId = (id) => document.getElementById(id);

  const trim = (s) => String(s || "").replace(/\s+/g, " ").trim();

  const formatDate = () => {
    try {
      return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(new Date());
    } catch (_) {
      return new Date().toLocaleDateString();
    }
  };

  const genDate = byId("genDate");
  if (genDate) genDate.textContent = "Generated " + formatDate();

  const fields = {
    company: byId("company"),
    budget: byId("budget"),
    bufferFloor: byId("bufferFloor"),
    bufferTarget: byId("bufferTarget"),
    mode: byId("mode"),
    trimPolicy: byId("trimPolicy"),
    custody: byId("custody"),
    cadence: byId("cadence"),
    approval: byId("approval"),
  };

  const getTrimPolicyText = () => {
    const sel = fields.trimPolicy;
    if (!sel) return "";
    const v = sel.value;
    if (v === "disabled") return "Disabled (accumulate-only posture)";
    if (v === "emergency") return "Emergency operations only (policy-limited, documented)";
    return "Optional, policy-limited: emergency ops • buffer rebuild • high-ROI reinvestment (documented)";
  };

  const getValue = (key) => {
    const el = fields[key];
    if (!el) return "";
    if (el.tagName === "SELECT") return trim(el.options[el.selectedIndex]?.textContent || el.value);
    return trim(el.value);
  };

  const render = () => {
    const company = getValue("company");
    const budget = getValue("budget") || "$____ / week";
    const bufferFloor = getValue("bufferFloor") || "$____";
    const bufferTarget = getValue("bufferTarget") || "—";
    const mode = getValue("mode") || "Auto-buy (baseline)";
    const custody = getValue("custody") || "—";
    const cadence = getValue("cadence") || "Monthly";
    const approval = getValue("approval") || "—";
    const trimPolicyText = getTrimPolicyText();

    const map = {
      company: company || "—",
      budget,
      bufferFloor,
      bufferTarget,
      mode,
      custody,
      cadence,
      approval,
      trimPolicyText,
    };

    outEls.forEach((node) => {
      const k = node.getAttribute("data-out");
      if (!k) return;
      if (Object.prototype.hasOwnProperty.call(map, k)) node.textContent = map[k];
    });
  };

  form.addEventListener("input", render);
  form.addEventListener("change", render);

  const printBtn = byId("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  render();
})();
