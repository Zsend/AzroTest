/* AZRO Fintech Site — v13 (no external libraries)
   Charts are rendered as SVG or Canvas from JSON data in /data.
*/

const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const $  = (sel, el=document) => el.querySelector(sel);

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function fmt(n, digits=2){
  if(n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if(abs >= 1e9) return (n/1e9).toFixed(2) + "B";
  if(abs >= 1e6) return (n/1e6).toFixed(2) + "M";
  if(abs >= 1e3) return (n/1e3).toFixed(2) + "K";
  return n.toFixed(digits);
}
function fmtPct(n, digits=1){
  if(n === null || n === undefined || Number.isNaN(n)) return "—";
  return (n*100).toFixed(digits) + "%";
}
function fmtUsd(n){
  if(n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {style:"currency", currency:"USD", maximumFractionDigits:0});
}
function fmtDate(s){
  // s: YYYY-MM-DD
  const d = new Date(s + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {year:"numeric", month:"short", day:"numeric"});
}
async function fetchJSON(url){
  const res = await fetch(url, {cache:"no-store"});
  if(!res.ok) throw new Error(`Failed to load ${url}`);
  return await res.json();
}

function initTheme(){
  const root = document.documentElement;
  const stored = localStorage.getItem("azro_theme");
  if(stored){
    root.setAttribute("data-theme", stored);
  }else{
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    root.setAttribute("data-theme", prefersLight ? "light" : "dark");
  }
  const btn = $("#themeToggle");
  if(btn){
    btn.addEventListener("click", () => {
      const cur = root.getAttribute("data-theme") || "dark";
      const next = (cur === "light") ? "dark" : "light";
      root.setAttribute("data-theme", next);
      localStorage.setItem("azro_theme", next);
      // re-render canvas charts for crispness
      window.dispatchEvent(new Event("azro:resize"));
    });
  }
}

function initMobileMenu(){
  const btn = $("#menuToggle");
  const menu = $("#mobileMenu");
  if(!btn || !menu) return;
  btn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$("#mobileMenu a").forEach(a => a.addEventListener("click", () => {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }));
}

function setActiveNav(){
  const path = location.pathname.split("/").pop() || "index.html";
  $$(".navlinks a, #mobileMenu a").forEach(a => {
    const href = (a.getAttribute("href")||"").split("/").pop();
    if(href === path){
      a.setAttribute("aria-current", "page");
    }else{
      a.removeAttribute("aria-current");
    }
  });
}

function ensureTooltip(){
  let tip = $("#chartTooltip");
  if(!tip){
    tip = document.createElement("div");
    tip.id = "chartTooltip";
    tip.style.position = "fixed";
    tip.style.zIndex = "999";
    tip.style.pointerEvents = "none";
    tip.style.padding = "10px 12px";
    tip.style.borderRadius = "12px";
    tip.style.border = "1px solid color-mix(in oklab, var(--border) 76%, transparent)";
    tip.style.background = "color-mix(in oklab, var(--surface) 92%, transparent)";
    tip.style.color = "var(--text)";
    tip.style.boxShadow = "0 18px 50px rgba(0,0,0,.35)";
    tip.style.fontSize = ".92rem";
    tip.style.maxWidth = "280px";
    tip.style.opacity = "0";
    tip.style.transform = "translateY(6px)";
    tip.style.transition = "opacity .12s ease, transform .12s ease";
    document.body.appendChild(tip);
  }
  return tip;
}
function showTip(html, x, y){
  const tip = ensureTooltip();
  tip.innerHTML = html;
  tip.style.left = (x + 12) + "px";
  tip.style.top = (y + 12) + "px";
  tip.style.opacity = "1";
  tip.style.transform = "translateY(0px)";
}
function hideTip(){
  const tip = $("#chartTooltip");
  if(!tip) return;
  tip.style.opacity = "0";
  tip.style.transform = "translateY(6px)";
}

/* ---------- SVG helpers ---------- */
function svgEl(tag, attrs={}){
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for(const [k,v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}
function clear(el){ while(el.firstChild) el.removeChild(el.firstChild); }

/* ---------- Bar Chart (SVG) ---------- */
function renderBarChart(svg, items, opts){

  const styles = getComputedStyle(document.documentElement);
  const ACCENT = styles.getPropertyValue("--accent").trim() || "#d6b15e";
  const ACCENT2 = styles.getPropertyValue("--accent2").trim() || "#7dd3fc";
  const SURFACE2 = styles.getPropertyValue("--surface2").trim() || "#12203a";
  // items: [{label, value, sub?, tooltipHtml?}]
  const W = 860, H = 420;
  const pad = {l:64, r:26, t:24, b:64};
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", opts.ariaLabel || "Bar chart");
  clear(svg);

  const maxV = Math.max(...items.map(d => d.value));
  const yMax = maxV * 1.12;

  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  // axes
  svg.appendChild(svgEl("line", {x1:pad.l, y1:pad.t+plotH, x2:pad.l+plotW, y2:pad.t+plotH, stroke:"currentColor", "stroke-opacity":"0.22"}));
  svg.appendChild(svgEl("line", {x1:pad.l, y1:pad.t, x2:pad.l, y2:pad.t+plotH, stroke:"currentColor", "stroke-opacity":"0.22"}));

  // y ticks
  const ticks = 5;
  for(let i=0;i<=ticks;i++){
    const t = i/ticks;
    const v = yMax*(1-t);
    const y = pad.t + plotH*t;
    const g = svgEl("g", {});
    g.appendChild(svgEl("line", {x1:pad.l, y1:y, x2:pad.l+plotW, y2:y, stroke:"currentColor", "stroke-opacity":"0.10"}));
    const tx = svgEl("text", {x:pad.l-10, y:y+4, "text-anchor":"end", "font-size":"12", "fill":"currentColor", "fill-opacity":"0.70"});
    tx.textContent = (opts.yFmt ? opts.yFmt(v) : fmt(v,2));
    g.appendChild(tx);
    svg.appendChild(g);
  }

  const gap = 18;
  const n = items.length;
  const barW = (plotW - gap*(n-1))/n;
  items.forEach((d,i) => {
    const x = pad.l + i*(barW+gap);
    const h = (d.value / yMax) * plotH;
    const y = pad.t + (plotH - h);

    const rect = svgEl("rect", {
      x, y, width:barW, height:h,
      rx:14, ry:14,
      fill:"url(#azroBarGrad)",
      stroke:"currentColor",
      "stroke-opacity":"0.12"
    });

    rect.addEventListener("mousemove", (e) => {
      if(!d.tooltipHtml) return;
      showTip(d.tooltipHtml, e.clientX, e.clientY);
    });
    rect.addEventListener("mouseleave", hideTip);

    svg.appendChild(rect);

    // value label
    const val = svgEl("text", {
      x: x + barW/2, y: y - 8,
      "text-anchor":"middle",
      "font-size":"12",
      "fill":"currentColor",
      "fill-opacity":"0.85",
      "font-family":"var(--mono)"
    });
    val.textContent = opts.valueFmt ? opts.valueFmt(d.value) : fmt(d.value,2);
    svg.appendChild(val);

    // x label
    const lab = svgEl("text", {
      x: x + barW/2, y: pad.t + plotH + 26,
      "text-anchor":"middle",
      "font-size":"12",
      "fill":"currentColor",
      "fill-opacity":"0.75"
    });
    lab.textContent = d.label;
    svg.appendChild(lab);

    if(d.sub){
      const sub = svgEl("text", {
        x: x + barW/2, y: pad.t + plotH + 44,
        "text-anchor":"middle",
        "font-size":"11",
        "fill":"currentColor",
        "fill-opacity":"0.55"
      });
      sub.textContent = d.sub;
      svg.appendChild(sub);
    }
  });

  // defs gradient
  const defs = svgEl("defs");
  const grad = svgEl("linearGradient", {id:"azroBarGrad", x1:"0", y1:"0", x2:"0", y2:"1"});
  grad.appendChild(svgEl("stop", {offset:"0%", "stop-color":ACCENT, "stop-opacity":"0.95"}));
  grad.appendChild(svgEl("stop", {offset:"100%", "stop-color":ACCENT2, "stop-opacity":"0.40"}));
  defs.appendChild(grad);
  svg.insertBefore(defs, svg.firstChild);

  if(opts.title){
    const t = svgEl("text", {x:pad.l, y:18, "font-size":"12", "fill":"currentColor", "fill-opacity":"0.70", "font-weight":"700"});
    t.textContent = opts.title;
    svg.appendChild(t);
  }
}

/* ---------- Line Chart (SVG) ---------- */
function renderLineChart(svg, points, opts){

  const styles = getComputedStyle(document.documentElement);
  const ACCENT = styles.getPropertyValue("--accent").trim() || "#d6b15e";
  const ACCENT2 = styles.getPropertyValue("--accent2").trim() || "#7dd3fc";
  const SURFACE2 = styles.getPropertyValue("--surface2").trim() || "#12203a";
  // points: [{x,label?}, {y}]
  const W = 860, H = 420;
  const pad = {l:64, r:26, t:24, b:64};
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role","img");
  svg.setAttribute("aria-label", opts.ariaLabel || "Line chart");
  clear(svg);

  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const xs = points.map(p=>p.x);
  const ys = points.map(p=>p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  let yMin = Math.min(...ys), yMax = Math.max(...ys);
  const padY = (yMax - yMin) * 0.12 || 1;
  yMin -= padY; yMax += padY;

  const xScale = x => pad.l + ( (x - xMin) / (xMax - xMin || 1) ) * plotW;
  const yScale = y => pad.t + (1 - (y - yMin) / (yMax - yMin || 1)) * plotH;

  // grid + y axis ticks
  const ticks = 5;
  for(let i=0;i<=ticks;i++){
    const t = i/ticks;
    const y = pad.t + plotH*t;
    const v = yMax - (yMax-yMin)*t;
    svg.appendChild(svgEl("line", {x1:pad.l, y1:y, x2:pad.l+plotW, y2:y, stroke:"currentColor", "stroke-opacity":"0.10"}));
    const tx = svgEl("text", {x:pad.l-10, y:y+4, "text-anchor":"end", "font-size":"12", "fill":"currentColor", "fill-opacity":"0.70"});
    tx.textContent = (opts.yFmt ? opts.yFmt(v) : fmt(v,2));
    svg.appendChild(tx);
  }
  svg.appendChild(svgEl("line", {x1:pad.l, y1:pad.t+plotH, x2:pad.l+plotW, y2:pad.t+plotH, stroke:"currentColor", "stroke-opacity":"0.22"}));
  svg.appendChild(svgEl("line", {x1:pad.l, y1:pad.t, x2:pad.l, y2:pad.t+plotH, stroke:"currentColor", "stroke-opacity":"0.22"}));

  // path
  let d = "";
  points.forEach((p,i)=>{
    const x = xScale(p.x), y = yScale(p.y);
    d += (i===0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  });

  // area under line
  const area = d + ` L ${xScale(points[points.length-1].x)} ${pad.t+plotH} L ${xScale(points[0].x)} ${pad.t+plotH} Z`;
  svg.appendChild(svgEl("path", {d:area, fill:"url(#azroAreaGrad)", "fill-opacity":"0.8"}));
  svg.appendChild(svgEl("path", {d, fill:"none", stroke:ACCENT2, "stroke-width":"3", "stroke-linecap":"round"}));

  // points
  points.forEach(p=>{
    const cx = xScale(p.x), cy = yScale(p.y);
    const c = svgEl("circle", {cx, cy, r:5, fill:ACCENT, "fill-opacity":"0.95", stroke:"currentColor", "stroke-opacity":"0.12"});
    if(p.tooltipHtml){
      c.addEventListener("mousemove", e => showTip(p.tooltipHtml, e.clientX, e.clientY));
      c.addEventListener("mouseleave", hideTip);
    }
    svg.appendChild(c);
  });

  // x labels (at most 7)
  const maxLabels = 7;
  const step = Math.ceil(points.length / maxLabels);
  points.forEach((p,i)=>{
    if(i%step!==0 && i!==points.length-1) return;
    const x = xScale(p.x);
    const tx = svgEl("text", {x, y: pad.t+plotH+28, "text-anchor":"middle", "font-size":"12", "fill":"currentColor", "fill-opacity":"0.70"});
    tx.textContent = p.label ?? String(p.x);
    svg.appendChild(tx);
  });

  // defs
  const defs = svgEl("defs");
  const grad = svgEl("linearGradient", {id:"azroAreaGrad", x1:"0", y1:"0", x2:"0", y2:"1"});
  grad.appendChild(svgEl("stop", {offset:"0%", "stop-color":ACCENT2, "stop-opacity":"0.28"}));
  grad.appendChild(svgEl("stop", {offset:"100%", "stop-color":SURFACE2, "stop-opacity":"0.0"}));
  defs.appendChild(grad);
  svg.insertBefore(defs, svg.firstChild);
}

/* ---------- BTC price (SVG line, log scale option) ---------- */
function renderBTCChart(svg, points, opts){

  const styles = getComputedStyle(document.documentElement);
  const ACCENT = styles.getPropertyValue("--accent").trim() || "#d6b15e";
  const ACCENT2 = styles.getPropertyValue("--accent2").trim() || "#7dd3fc";
  const SURFACE2 = styles.getPropertyValue("--surface2").trim() || "#12203a";
  const series = points.map(p=>({x: new Date(p.date).getTime(), y: opts.log ? p.log10 : p.close, date:p.date, close:p.close, dd:p.drawdown}));
  const W=860,H=420,pad={l:64,r:26,t:24,b:64};
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role","img");
  svg.setAttribute("aria-label", opts.ariaLabel || "Bitcoin price chart");
  clear(svg);

  const plotW=W-pad.l-pad.r, plotH=H-pad.t-pad.b;
  const xs=series.map(p=>p.x), ys=series.map(p=>p.y);
  const xMin=Math.min(...xs), xMax=Math.max(...xs);
  const yMin=Math.min(...ys), yMax=Math.max(...ys);
  const xScale=x=>pad.l+((x-xMin)/(xMax-xMin||1))*plotW;
  const yScale=y=>pad.t+(1-(y-yMin)/(yMax-yMin||1))*plotH;

  // grid
  const ticksY=5;
  for(let i=0;i<=ticksY;i++){
    const t=i/ticksY;
    const y=pad.t+plotH*t;
    svg.appendChild(svgEl("line",{x1:pad.l,y1:y,x2:pad.l+plotW,y2:y,stroke:"currentColor","stroke-opacity":"0.10"}));
    const v=yMax-(yMax-yMin)*t;
    const label=svgEl("text",{x:pad.l-10,y:y+4,"text-anchor":"end","font-size":"12","fill":"currentColor","fill-opacity":"0.70"});
    label.textContent = opts.log ? `10^${v.toFixed(1)}` : fmt(v,0);
    svg.appendChild(label);
  }
  svg.appendChild(svgEl("line",{x1:pad.l,y1:pad.t+plotH,x2:pad.l+plotW,y2:pad.t+plotH,stroke:"currentColor","stroke-opacity":"0.22"}));
  svg.appendChild(svgEl("line",{x1:pad.l,y1:pad.t,x2:pad.l,y2:pad.t+plotH,stroke:"currentColor","stroke-opacity":"0.22"}));

  // path
  let d="";
  series.forEach((p,i)=>{
    const x=xScale(p.x), y=yScale(p.y);
    d += (i===0?`M ${x} ${y}`:` L ${x} ${y}`);
  });
  const area=d+` L ${xScale(series[series.length-1].x)} ${pad.t+plotH} L ${xScale(series[0].x)} ${pad.t+plotH} Z`;
  const defs=svgEl("defs");
  const grad=svgEl("linearGradient",{id:"btcGrad",x1:"0",y1:"0",x2:"0",y2:"1"});
  grad.appendChild(svgEl("stop",{offset:"0%","stop-color":ACCENT,"stop-opacity":"0.22"}));
  grad.appendChild(svgEl("stop",{offset:"100%","stop-color":SURFACE2,"stop-opacity":"0"}));
  defs.appendChild(grad);
  svg.appendChild(defs);
  svg.appendChild(svgEl("path",{d:area,fill:"url(#btcGrad)"}));
  const path=svgEl("path",{d,fill:"none",stroke:ACCENT,"stroke-width":"2.5","stroke-linecap":"round"});
  svg.appendChild(path);

  // hover interaction — nearest point
  const hit = svgEl("rect",{x:pad.l,y:pad.t,width:plotW,height:plotH,fill:"transparent"});
  svg.appendChild(hit);
  hit.addEventListener("mousemove", (e)=>{
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM().inverse();
    const loc = pt.matrixTransform(ctm);
    const xVal = xMin + ((loc.x - pad.l)/plotW)*(xMax-xMin);
    const idx = clamp(Math.round((xVal - xMin) / ((xMax-xMin)/(series.length-1||1))), 0, series.length-1);
    const p = series[idx];
    const html = `
      <div style="font-weight:800;letter-spacing:-.01em">${fmtDate(p.date)}</div>
      <div style="margin-top:6px;display:flex;justify-content:space-between;gap:10px">
        <span style="color:var(--muted2)">Price</span>
        <span style="font-family:var(--mono)">${fmtUsd(p.close)}</span>
      </div>
      <div style="margin-top:4px;display:flex;justify-content:space-between;gap:10px">
        <span style="color:var(--muted2)">Drawdown from ATH</span>
        <span style="font-family:var(--mono)">${fmtPct(p.dd,1)}</span>
      </div>
    `;
    showTip(html, e.clientX, e.clientY);
  });
  hit.addEventListener("mouseleave", hideTip);

  // x ticks (years)
  const years = [];
  for(const p of series){
    const d = new Date(p.x);
    const y = d.getUTCFullYear();
    if(!years.includes(y) && (y%2===0)) years.push(y);
  }
  years.slice(0,7).forEach(y=>{
    const t = Date.UTC(y,0,1);
    const x = xScale(t);
    const tx = svgEl("text",{x, y:pad.t+plotH+28, "text-anchor":"middle","font-size":"12","fill":"currentColor","fill-opacity":"0.70"});
    tx.textContent = String(y);
    svg.appendChild(tx);
  });
}

/* ---------- Scatter (Canvas) ---------- */
function renderScatter(canvas, points, opts){
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  const parent = canvas.parentElement;
  const rect = parent.getBoundingClientRect();
  const W = Math.max(320, rect.width);
  const H = Math.max(280, Math.min(420, rect.width * 0.52));

  canvas.width = Math.round(W*dpr);
  canvas.height = Math.round(H*dpr);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr,0,0,dpr,0,0);

  // theme colors from CSS
  const styles = getComputedStyle(document.documentElement);
  const text = styles.getPropertyValue("--text").trim();
  const border = styles.getPropertyValue("--border").trim();
  const accent = styles.getPropertyValue("--accent").trim();
  const accent2 = styles.getPropertyValue("--accent2").trim();

  ctx.clearRect(0,0,W,H);

  const pad = {l:64,r:22,t:18,b:54};
  const plotW=W-pad.l-pad.r, plotH=H-pad.t-pad.b;

  const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
  const xMin=Math.min(...xs), xMax=Math.max(...xs);
  const yMin=Math.min(...ys), yMax=Math.max(...ys);

  const xScale=x=>pad.l+((x-xMin)/(xMax-xMin||1))*plotW;
  const yScale=y=>pad.t+(1-(y-yMin)/(yMax-yMin||1))*plotH;

  // grid
  ctx.strokeStyle = border;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  for(let i=0;i<=5;i++){
    const y=pad.t+plotH*(i/5);
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+plotW,y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // axes
  ctx.strokeStyle = text;
  ctx.globalAlpha = 0.22;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t+plotH); ctx.lineTo(pad.l+plotW, pad.t+plotH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t+plotH); ctx.stroke();
  ctx.globalAlpha = 1;

  // labels
  ctx.fillStyle = text;
  ctx.globalAlpha = 0.70;
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
  for(let i=0;i<=5;i++){
    const v = yMax - (yMax-yMin)*(i/5);
    const y=pad.t+plotH*(i/5);
    ctx.textAlign="right";
    ctx.fillText(opts.yFmt ? opts.yFmt(v) : fmt(v,2), pad.l-10, y+4);
  }
  ctx.textAlign="center";
  ctx.fillText(opts.xLabel || "Drawdown (min)", pad.l + plotW/2, H-18);
  ctx.save();
  ctx.translate(18, pad.t + plotH/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText(opts.yLabel || "Multiple", 0, 0);
  ctx.restore();
  ctx.globalAlpha = 1;

  // point colors by mode
  const modeColor = (mode)=>{
    if(mode.toLowerCase().includes("valve")) return accent;
    if(mode.toLowerCase().includes("accumulate")) return accent2;
    return text;
  };

  // draw points
  ctx.globalAlpha = 0.78;
  for(const p of points){
    const x=xScale(p.x), y=yScale(p.y);
    ctx.fillStyle = modeColor(p.mode);
    ctx.beginPath();
    ctx.arc(x,y,2.2,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // hover
  canvas.onmousemove = (e)=>{
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    // nearest point search (sampled to avoid O(n) heavy; still fine for 2000)
    let best=null, bestD=1e9;
    for(const p of points){
      const x=xScale(p.x), y=yScale(p.y);
      const dx=mx-x, dy=my-y;
      const d=dx*dx+dy*dy;
      if(d<bestD){ bestD=d; best=p; }
    }
    if(best && bestD < 200){ // ~14px radius
      const html = `
        <div style="font-weight:800;letter-spacing:-.01em">Rank #${best.rank}</div>
        <div style="margin-top:6px;color:var(--muted2)">${best.mode} • ${best.profile}</div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;gap:10px">
          <span style="color:var(--muted2)">BTC‑eq</span>
          <span style="font-family:var(--mono)">${fmt(best.btc_eq,3)}</span>
        </div>
        <div style="margin-top:4px;display:flex;justify-content:space-between;gap:10px">
          <span style="color:var(--muted2)">Multiple</span>
          <span style="font-family:var(--mono)">${fmt(best.multiple,2)}×</span>
        </div>
        <div style="margin-top:4px;display:flex;justify-content:space-between;gap:10px">
          <span style="color:var(--muted2)">Min drawdown</span>
          <span style="font-family:var(--mono)">${fmtPct(best.drawdown,1)}</span>
        </div>
      `;
      showTip(html, e.clientX, e.clientY);
    }else{
      hideTip();
    }
  };
  canvas.onmouseleave = hideTip;
}

/* ---------- Page initializers ---------- */
async function initCharts(){
  const chartEls = $$("[data-chart]");
  if(chartEls.length === 0) return;


  // Load data once (prefer inlined bundle for file:// compatibility)
  const bundle = window.AZRO_DATA || null;
  const modes = bundle ? bundle.all_modes_current : await fetchJSON("data/all_modes_current.json").catch(()=>null);
  const startDates = bundle ? bundle.start_date_robustness : await fetchJSON("data/start_date_robustness.json").catch(()=>null);
  const btc = bundle ? bundle.btc_weekly : await fetchJSON("data/btc_weekly.json").catch(()=>null);
  const grid = bundle ? bundle.grid_search_sample : await fetchJSON("data/grid_search_sample.json").catch(()=>null);
  const lens = bundle ? bundle.compounding_lens : await fetchJSON("data/compounding_lens.json").catch(()=>null);


  // Fill "as of" stamps
  $$("[data-asof]").forEach(el=>{
    const v = (btc && btc.as_of) ? fmtDate(btc.as_of) : "—";
    el.textContent = v;
  });

  // Render charts that exist on this page
  chartEls.forEach(el=>{
    const kind = el.getAttribute("data-chart");
    if(kind === "modes-bars" && modes){
      const rows = modes.rows.filter(r => r.profile === "Balanced");
      const order = ["AutoBuy","AccumulateOnly","ValveSmooth"];
      const label = (m)=>{
        if(m==="AutoBuy") return "Auto‑buy";
        if(m==="AccumulateOnly") return "Accumulate‑only";
        if(m==="ValveSmooth") return "Valve (smooth)";
        return m;
      };
      const items = order.map(m=>{
        const r = rows.find(x=>x.mode===m);
        return {
          label: label(m),
          value: r ? r.btc_eq : 0,
          sub: "Balanced",
          tooltipHtml: r ? `
            <div style="font-weight:800;letter-spacing:-.01em">${label(m)} • Balanced</div>
            <div style="margin-top:8px;display:flex;justify-content:space-between;gap:10px">
              <span style="color:var(--muted2)">BTC‑eq (end)</span>
              <span style="font-family:var(--mono)">${fmt(r.btc_eq,3)}</span>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;gap:10px">
              <span style="color:var(--muted2)">End BTC</span>
              <span style="font-family:var(--mono)">${fmt(r.end_btc,3)}</span>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;gap:10px">
              <span style="color:var(--muted2)">End cash buffer</span>
              <span style="font-family:var(--mono)">${fmtUsd(r.end_cash_usd)}</span>
            </div>
          ` : null
        };
      });

      renderBarChart(el, items, {
        title: "BTC‑equivalent end balance (example config)",
        ariaLabel: "BTC-equivalent end balance by mode",
        yFmt: (v)=>fmt(v,2),
        valueFmt:(v)=>fmt(v,3)
      });
    }

    if(kind === "startdate-line" && startDates){
      const rows = startDates.rows.slice().sort((a,b)=>a.start.localeCompare(b.start));
      const pts = rows.map((r,i)=>({
        x:i,
        y:r.multiple_vs_autobuy,
        label: r.start.slice(0,4),
        tooltipHtml: `
          <div style="font-weight:800;letter-spacing:-.01em">Start: ${r.start}</div>
          <div style="margin-top:6px;color:var(--muted2)">Example config • fees included</div>
          <div style="margin-top:8px;display:flex;justify-content:space-between;gap:10px">
            <span style="color:var(--muted2)">Multiple vs auto‑buy</span>
            <span style="font-family:var(--mono)">${fmt(r.multiple_vs_autobuy,2)}×</span>
          </div>
          <div style="margin-top:4px;display:flex;justify-content:space-between;gap:10px">
            <span style="color:var(--muted2)">Extra sats</span>
            <span style="font-family:var(--mono)">${fmt(r.extra_sats_m,1)}M</span>
          </div>
        `
      }));
      renderLineChart(el, pts, {
        ariaLabel: "Multiple versus auto-buy across different start dates",
        yFmt: (v)=>`${fmt(v,2)}×`
      });
    }

    if(kind === "btc-log" && btc){
      renderBTCChart(el, btc.points, {log:true, ariaLabel:"Bitcoin price chart (log scale)"});
    }

    if(kind === "grid-scatter" && grid){
      const pts = grid.rows.map(r=>({
        x: r.drawdown,
        y: r.multiple,
        rank: r.rank,
        mode: r.mode,
        profile: r.profile,
        btc_eq: r.btc_eq,
        multiple: r.multiple,
        drawdown: r.drawdown
      }));
      renderScatter(el, pts, {
        xLabel:"Min drawdown",
        yLabel:"Multiple",
        yFmt:(v)=>`${fmt(v,2)}×`
      });
      // re-render on theme/resize
      const rer = ()=>renderScatter(el, pts, {xLabel:"Min drawdown", yLabel:"Multiple", yFmt:(v)=>`${fmt(v,2)}×`});
      window.addEventListener("azro:resize", rer);
      window.addEventListener("resize", ()=>window.dispatchEvent(new Event("azro:resize")));
    }

    if(kind === "lens-bars" && lens){
      // Show multipliers at 10 years for different accretion rates
      const y = "10";
      const items = lens.rates.map(r=>{
        const ratePct = Math.round(r.rate*100);
        const label = ratePct === 0 ? "0%" : `${ratePct}%`;
        return {
          label,
          value: r[y],
          sub: "Annual BTC accretion",
          tooltipHtml: `
            <div style="font-weight:800;letter-spacing:-.01em">${label} annual accretion</div>
            <div style="margin-top:8px;display:flex;justify-content:space-between;gap:10px">
              <span style="color:var(--muted2)">10‑year multiplier</span>
              <span style="font-family:var(--mono)">${fmt(r[y],2)}×</span>
            </div>
            <div style="margin-top:4px;color:var(--muted2)">Formula: (1 + a)^n</div>
          `
        };
      });
      renderBarChart(el, items, {
        title: "Compounding lens (10‑year multiplier)",
        ariaLabel:"Compounding lens 10-year multiplier",
        yFmt:(v)=>`${fmt(v,1)}×`,
        valueFmt:(v)=>`${fmt(v,2)}×`
      });
    }
  });

  // Fill tables
  const sdTable = $("#startDateTableBody");
  if(sdTable && startDates){
    sdTable.innerHTML = "";
    const rows = startDates.rows.slice().sort((a,b)=>a.start.localeCompare(b.start));
    for(const r of rows){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Start">${r.start}</td>
        <td class="num" data-label="Years">${fmt(r.years,2)}</td>
        <td class="num" data-label="Contrib">${fmtUsd(r.contrib_usd)}</td>
        <td class="num" data-label="Auto‑buy BTC‑eq">${fmt(r.autobuy_btc_eq,3)}</td>
        <td class="num" data-label="Valve BTC‑eq">${fmt(r.valvesmooth_btc_eq,3)}</td>
        <td class="num" data-label="Multiple">${fmt(r.multiple_vs_autobuy,2)}×</td>
        <td class="num" data-label="Extra sats">${fmt(r.extra_sats_m,1)}M</td>
      `;
      sdTable.appendChild(tr);
    }
  }

  const modesTable = $("#modesTableBody");
  if(modesTable && modes){
    modesTable.innerHTML = "";
    const rows = modes.rows.slice().sort((a,b)=>a.profile.localeCompare(b.profile) || a.mode.localeCompare(b.mode));
    for(const r of rows){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Mode">${r.mode}</td>
        <td data-label="Profile">${r.profile}</td>
        <td class="num" data-label="BTC‑eq">${fmt(r.btc_eq,3)}</td>
        <td class="num" data-label="End cash">${fmtUsd(r.end_cash_usd)}</td>
        <td class="num" data-label="Fees">${fmtUsd(r.fees_usd)}</td>
        <td class="num" data-label="Tax">${fmtUsd(r.tax_usd)}</td>
        <td class="num" data-label="Trades">${r.trades}</td>
      `;
      modesTable.appendChild(tr);
    }
  }
}

function initScrollSpy(){
  // Light-weight: highlight anchors on scroll for pages with in-page nav
  const anchors = $$("[data-scrollspy] a[href^='#']");
  if(anchors.length === 0) return;
  const ids = anchors.map(a => a.getAttribute("href").slice(1)).filter(Boolean);
  const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
  const setActive = (id)=>{
    anchors.forEach(a=>{
      if(a.getAttribute("href")==="#"+id) a.setAttribute("aria-current","page");
      else a.removeAttribute("aria-current");
    });
  };
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting) setActive(e.target.id);
    });
  }, {rootMargin:"-35% 0px -55% 0px", threshold:0.01});
  sections.forEach(s=>io.observe(s));
}

window.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initMobileMenu();
  setActiveNav();
  initScrollSpy();
  await initCharts();
});


// Footer year
(() => {
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
