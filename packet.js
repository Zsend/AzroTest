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

  const dateStr = "Generated " + formatDate();
  const genDate = byId("genDate");
  if (genDate) genDate.textContent = dateStr;
  const footerText = byId("footerText");
  if (footerText) footerText.textContent = "AZRO Systems • Board Packet • " + dateStr;

  const fields = {
    company: byId("company"),
    preset: byId("preset"),
    budget: byId("budget"),
    bufferFloor: byId("bufferFloor"),
    bufferTarget: byId("bufferTarget"),
    mode: byId("mode"),
    trimPolicy: byId("trimPolicy"),
    custody: byId("custody"),
    cadence: byId("cadence"),
    approval: byId("approval"),
  };

  const setSelect = (sel, match, byValue = false) => {
    if (!sel) return;
    const opts = Array.from(sel.options || []);
    const idx = opts.findIndex((o) => (byValue ? o.value === match : trim(o.textContent) === match));
    if (idx >= 0) sel.selectedIndex = idx;
  };

  const presets = {
    balanced: {
      budget: "$3,000 / week",
      bufferFloor: "$150,000",
      bufferTarget: "$150,000–$200,000",
      modeText: "Valve Smooth",
      trimPolicyValue: "optional",
      custodyText: "Multisig",
      cadenceText: "Monthly",
      approval: "$10,000 or any custody transfer",
    },
    ops: {
      budget: "$1,000 / week",
      bufferFloor: "6 months operating expenses",
      bufferTarget: "6–9 months operating expenses",
      modeText: "Valve Smooth",
      trimPolicyValue: "emergency",
      custodyText: "Institutional custody",
      cadenceText: "Monthly + quarterly board review",
      approval: "Any custody transfer; trims require documented approval",
    },
    lean: {
      budget: "$200 / week",
      bufferFloor: "$25,000",
      bufferTarget: "$25,000–$40,000",
      modeText: "Auto-buy (baseline)",
      trimPolicyValue: "disabled",
      custodyText: "Multisig",
      cadenceText: "Monthly",
      approval: "Any custody transfer",
    },
  };

  const applyPreset = () => {
    const p = fields.preset;
    if (!p) return;
    const key = p.value;
    if (!key || key === "custom") return;
    const cfg = presets[key];
    if (!cfg) return;

    if (fields.budget) fields.budget.value = cfg.budget;
    if (fields.bufferFloor) fields.bufferFloor.value = cfg.bufferFloor;
    if (fields.bufferTarget) fields.bufferTarget.value = cfg.bufferTarget;
    setSelect(fields.mode, cfg.modeText);
    setSelect(fields.trimPolicy, cfg.trimPolicyValue, true);
    setSelect(fields.custody, cfg.custodyText);
    setSelect(fields.cadence, cfg.cadenceText);
    if (fields.approval) fields.approval.value = cfg.approval;
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

  if (fields.preset) {
    fields.preset.addEventListener("change", () => {
      applyPreset();
      render();
    });
  }

  const printBtn = byId("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  render();
})();
