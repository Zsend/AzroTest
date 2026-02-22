/* AZRO — Enterprise site scripts (no external dependencies) */

(function(){
  const qs = (s, el=document)=>el.querySelector(s);
  const qsa = (s, el=document)=>Array.from(el.querySelectorAll(s));

  // Active nav state
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  qsa('.nav a, .drawer-panel a').forEach(a=>{
    const href = (a.getAttribute('href') || '').toLowerCase();
    if(href === path){
      a.setAttribute('aria-current','page');
    } else {
      a.removeAttribute('aria-current');
    }
  });

  // Mobile drawer
  const drawer = qs('#drawer');
  const openBtn = qs('#drawerOpen');
  const closeBtn = qs('#drawerClose');

  function openDrawer(){
    if(!drawer) return;
    drawer.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    const firstLink = qs('.drawer-panel a', drawer);
    if(firstLink) firstLink.focus();
  }
  function closeDrawer(){
    if(!drawer) return;
    drawer.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(openBtn) openBtn.focus();
  }

  if(openBtn) openBtn.addEventListener('click', openDrawer);
  if(closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if(drawer){
    drawer.addEventListener('click', (e)=>{
      if(e.target === drawer) closeDrawer();
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && drawer.getAttribute('aria-hidden')==='false') closeDrawer();
    });
  }

  // Accordions
  qsa('.accordion .acc-item').forEach(item=>{
    const btn = qs('.acc-btn', item);
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      const expanded = item.getAttribute('aria-expanded') === 'true';
      item.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
  });

  // Performance data render (home + methodology)
  const perfTargets = qsa('[data-perf-target]');
  if(perfTargets.length){
    fetch('assets/data/performance.json')
      .then(r=>r.ok ? r.json() : Promise.reject())
      .then(data=>{
        perfTargets.forEach(el=>{
          const target = el.getAttribute('data-perf-target');
          if(target === 'snapshot') renderSnapshot(el, data);
          if(target === 'robustness') renderRobustness(el, data);
          if(target === 'sample') renderSample(el, data);
        });
      })
      .catch(()=>{/* fail quietly */});
  }

  function fmtNum(x, digits=3){
    if(x === null || x === undefined || Number.isNaN(Number(x))) return '—';
    const n = Number(x);
    if(Math.abs(n) >= 1000) return n.toLocaleString(undefined, {maximumFractionDigits: 0});
    return n.toLocaleString(undefined, {maximumFractionDigits: digits});
  }

  function fmtPct(x){
    if(x === null || x === undefined || Number.isNaN(Number(x))) return '—';
    const n = Number(x) * 100;
    return `${n.toFixed(1)}%`;
  }

  function renderSample(el, data){
    const s = data.sample || {};
    el.innerHTML = `
      <span class="badge"><span class="mono">${s.instrument || 'Dataset'}</span></span>
      <span class="badge">Frequency: <span class="mono">${s.frequency || '—'}</span></span>
      <span class="badge">Sample: <span class="mono">${s.start_date || '—'}</span> → <span class="mono">${s.end_date || '—'}</span></span>
    `;
  }

  function renderSnapshot(el, data){
    const rows = (data.strategies || []).map(s=>`
      <tr>
        <td>
          <div style="font-weight:720">${s.strategy}</div>
          <div class="muted" style="margin-top:4px">${s.mode}${s.profile ? ` • ${s.profile}` : ''}</div>
        </td>
        <td class="right mono">${fmtNum(s.btc_eq, 3)}</td>
        <td class="right mono">${fmtNum(s.x_auto, 3)}×</td>
        <td class="right mono">$${fmtNum(s.acct_value_usd, 0)}</td>
        <td class="right mono">${fmtNum(s.multiple_on_contrib, 2)}×</td>
        <td class="right mono">${s.max_drawdown !== null && s.max_drawdown !== undefined ? fmtPct(s.max_drawdown) : '—'}</td>
      </tr>
    `).join('');

    el.innerHTML = `
      <table class="table" aria-label="Backtest performance snapshot">
        <thead>
          <tr>
            <th>Strategy</th>
            <th class="right">BTC&nbsp;equivalent</th>
            <th class="right">vs&nbsp;auto</th>
            <th class="right">End value</th>
            <th class="right">Multiple*</th>
            <th class="right">Max drawdown†</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="muted" style="margin-top:12px; font-size:12px;">
        *Multiple is end account value divided by total contributions in the simulation. †Max drawdown is based on simulated equity curve; methodology details and limitations apply.
      </div>
    `;
  }

  function renderRobustness(el, data){
    const pts = (data.robustness_start_dates || []).slice(0);
    if(!pts.length) return;

    // sort by start label
    pts.sort((a,b)=>String(a.start).localeCompare(String(b.start)));

    const maxX = Math.max(...pts.map(p=>Number(p.x_auto)));
    const w = 640, h = 240, pad = 34, barGap = 10;
    const innerW = w - pad*2;
    const innerH = h - pad*2;

    const barW = Math.max(18, (innerW - barGap*(pts.length-1)) / pts.length);
    const scaleY = (x)=> innerH * (x / maxX);

    const bars = pts.map((p,i)=>{
      const x = pad + i*(barW+barGap);
      const barH = scaleY(Number(p.x_auto));
      const y = pad + (innerH - barH);
      const label = String(p.start).slice(0,4);
      return `
        <g>
          <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="10" ry="10" fill="rgba(11,92,255,0.20)" stroke="rgba(11,92,255,0.35)"/>
          <text x="${x + barW/2}" y="${h - 12}" text-anchor="middle" font-size="12" fill="rgba(73,87,109,1)">${label}</text>
          <text x="${x + barW/2}" y="${y - 8}" text-anchor="middle" font-size="12" fill="rgba(11,92,255,1)" font-weight="700">${Number(p.x_auto).toFixed(2)}×</text>
        </g>
      `;
    }).join('');

    const axes = `
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${pad+innerH}" stroke="rgba(15,23,42,0.18)"/>
      <line x1="${pad}" y1="${pad+innerH}" x2="${pad+innerW}" y2="${pad+innerH}" stroke="rgba(15,23,42,0.18)"/>
      <text x="${pad}" y="${pad - 10}" font-size="12" fill="rgba(101,116,140,1)">Multiple vs auto (higher is better)</text>
    `;

    el.innerHTML = `
      <div class="card">
        <h3 style="margin:0 0 10px;">Robustness check (start-date sensitivity)</h3>
        <p style="margin:0 0 16px; color:var(--muted); font-size:14px;">
          Same rules, different start dates. Results vary by regime; the goal is disciplined execution across cycles, not short-window optimization.
        </p>
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="auto" role="img" aria-label="Bar chart of multiple vs auto by start year">
          ${axes}
          ${bars}
        </svg>
        <div class="muted" style="margin-top:10px; font-size:12px;">
          This chart shows the Valve Smooth (Balanced) strategy’s simulated multiple vs auto for several start dates (using weekly data). See Methodology for assumptions and limitations.
        </div>
      </div>
    `;
  }
})();