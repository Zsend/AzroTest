(() => {
  "use strict";
  const $=(q,c=document)=>c.querySelector(q), $$=(q,c=document)=>[...c.querySelectorAll(q)];
  const nice=n=>Number(n||0).toLocaleString("en-US");
  const escapeHtml=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const human=v=>String(v||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
  const LOCAL=window.JG_CONFIG?.mode==="local";
  const FALLBACK={updated_at:null,actual:{employer_applications:0,verified_employers:0,open_jobs:0,interviews:0,career_starts:0,retained_180:0,advancement_events:0},targets_12_month:{verified_employers:50,open_jobs:100,interviews:200,career_starts:100,retained_180:75,advancement_events:30}};
  let employers=[], claims=[];

  const menu=$("#menuBtn"), mobile=$("#mobileMenu");
  menu?.addEventListener("click",()=>{const open=mobile.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));});
  $$("#mobileMenu a").forEach(a=>a.addEventListener("click",()=>{mobile?.classList.remove("open");menu?.setAttribute("aria-expanded","false");}));
  if($("#year"))$("#year").textContent=new Date().getFullYear();

  function renderMetrics(data){
    const actual=data.actual||FALLBACK.actual, targets=data.targets_12_month||FALLBACK.targets_12_month;
    $$('[data-metric]').forEach(el=>el.textContent=nice(actual[el.dataset.metric]));
    const outcomeTotal=(actual.open_jobs||0)+(actual.career_starts||0)+(actual.retained_180||0)+(actual.advancement_events||0);
    const title=$("#ledgerStatusTitle"),copy=$("#ledgerStatusCopy"),stamp=$("#ledgerUpdated");
    if((actual.verified_employers||0)===0 && outcomeTotal===0){
      title.textContent="No participating employer has completed the full outcome path yet.";
      copy.textContent="That does not prove fair-chance hiring never happens. It means no outcome in this ledger has met the current evidence standard.";
    }else{
      title.textContent=`${nice(actual.verified_employers)} employer${actual.verified_employers===1?" has":"s have"} earned verified public credit.`;
      copy.textContent=`The ledger currently shows ${nice(actual.open_jobs)} live role${actual.open_jobs===1?"":"s"}, ${nice(actual.career_starts)} candidate-confirmed start${actual.career_starts===1?"":"s"}, and ${nice(actual.advancement_events)} mobility event${actual.advancement_events===1?"":"s"}.`;
    }
    stamp.textContent=data.updated_at?`${LOCAL?"Browser-test ledger":"Public ledger"} updated ${new Date(data.updated_at).toLocaleString()}`:"No verified update timestamp is available.";

    const funnelDefs=[["Applications",actual.employer_applications],["Verified employers",actual.verified_employers],["Live paid roles",actual.open_jobs],["Interviews",actual.interviews],["Career starts",actual.career_starts],["Retained 180 days",actual.retained_180],["Advancement",actual.advancement_events]];
    const max=Math.max(1,...funnelDefs.map(([,v])=>Number(v||0)));
    $("#ledgerFunnel").innerHTML=funnelDefs.map(([label,value])=>`<div class="funnel-row"><div class="funnel-bar" role="progressbar" aria-label="${escapeHtml(label)}: ${nice(value)}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${Number(value||0)}"><div class="funnel-fill" style="width:${Math.max(value?5:0,(Number(value||0)/max)*100)}%"></div><div class="funnel-name">${escapeHtml(label)}</div></div><span class="funnel-number">${nice(value)}</span></div>`).join("");

    const targetDefs=[["Verified employers","verified_employers"],["Live paid roles","open_jobs"],["Interviews","interviews"],["Career starts","career_starts"],["Retained 180 days","retained_180"],["Advancement","advancement_events"]];
    $("#ledgerTargets").innerHTML=targetDefs.map(([label,key])=>{const value=Number(actual[key]||0),target=Number(targets[key]||1),pct=Math.min(100,value/target*100);return `<div class="bar-row"><span class="bar-label">${escapeHtml(label)}</span><div class="bar-track" role="progressbar" aria-label="${escapeHtml(label)}: ${nice(value)} of ${nice(target)} target" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${value}"><span class="bar-target"></span><span class="bar-actual" style="width:${pct}%"></span></div><span class="bar-value">${nice(value)}</span></div>`;}).join("");
  }

  function renderEmployers(body){
    employers=body.items||[];
    const rows=$("#ledgerRows");
    if(!employers.length){rows.innerHTML='<tr><td class="ledger-table-empty" colspan="8"><strong>No employer has earned public credit yet.</strong><span>The first row will appear after policy review, public-name consent, and the relevant proof event. Sponsorship cannot buy a place here.</span></td></tr>';return;}
    rows.innerHTML=employers.map(e=>`<tr><td><strong>${escapeHtml(e.org_name)}</strong>${e.website?`<a class="ledger-org-link" href="${escapeHtml(e.website)}" target="_blank" rel="noopener">Source site ↗</a>`:""}</td><td><span class="proof-level">${escapeHtml(human(e.proof_level))}</span></td><td>${nice(e.open_roles)}</td><td>${nice(e.interviews)}</td><td>${nice(e.career_starts)}</td><td>${nice(e.retained_180)}</td><td>${nice(e.advancement_events)}</td><td>${e.last_verified_at?new Date(e.last_verified_at).toLocaleDateString():"—"}</td></tr>`).join("");
    if(body.disclosure)$("#ledgerDisclosure").textContent=body.disclosure;
  }

  function renderClaims(body){
    claims=body.items||[];
    const rows=$("#claimRows");
    if(!claims.length){rows.innerHTML='<tr><td class="ledger-table-empty" colspan="6"><strong>No reviewed claim finding has been published.</strong><span>Research leads remain private until evidence review and right of reply support a public disposition.</span></td></tr>';return;}
    const findingLabel={verified_role:"Verified role located",verified_outcome:"Verified outcome located",closed_no_evidence:"No qualifying evidence located"};
    rows.innerHTML=claims.map(c=>`<tr><td><strong>${escapeHtml(c.company_name)}</strong><a class="ledger-org-link" href="${escapeHtml(c.claim_url)}" target="_blank" rel="noopener">Public source ↗</a></td><td>${escapeHtml(human(c.claim_type))}</td><td><span class="finding-pill finding-pill--${escapeHtml(c.finding_status)}">${escapeHtml(findingLabel[c.finding_status]||human(c.finding_status))}</span></td><td class="claim-note">${escapeHtml(c.evidence_note||"—")}</td><td>${escapeHtml(human(c.right_of_reply_status))}</td><td>${c.updated_at?new Date(c.updated_at).toLocaleDateString():"—"}</td></tr>`).join("");
    if(body.disclosure)$("#claimDisclosure").textContent=body.disclosure;
  }

  function csvCell(value){const text=String(value??"");return /[",\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text;}
  $("#exportLedger")?.addEventListener("click",()=>{
    const header=["Employer","Proof level","Live roles","Interviews","Career starts","Retained 180 days","Advancement events","Last verified"];
    const rows=employers.map(e=>[e.org_name,human(e.proof_level),e.open_roles,e.interviews,e.career_starts,e.retained_180,e.advancement_events,e.last_verified_at||""]);
    const blob=new Blob([[header,...rows].map(row=>row.map(csvCell).join(",")).join("\n")],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="justice-grows-public-proof-ledger.csv";a.click();URL.revokeObjectURL(a.href);
  });
  $("#exportClaims")?.addEventListener("click",()=>{
    const header=["Company","Claim type","Finding","Evidence note","Right of reply","Source URL","Updated"];
    const rows=claims.map(c=>[c.company_name,human(c.claim_type),human(c.finding_status),c.evidence_note||"",human(c.right_of_reply_status),c.claim_url,c.updated_at||""]);
    const blob=new Blob([[header,...rows].map(row=>row.map(csvCell).join(",")).join("\n")],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="justice-grows-public-claim-findings.csv";a.click();URL.revokeObjectURL(a.href);
  });

  async function init(){
    let metrics=FALLBACK, ledger={items:[]}, findings={items:[]};
    try{const [m,e,c]=await Promise.all([fetch("/api/public/metrics",{cache:"no-store"}),fetch("/api/public/employers",{cache:"no-store"}),fetch("/api/public/claims",{cache:"no-store"})]);if(m.ok)metrics=await m.json();if(e.ok)ledger=await e.json();if(c.ok)findings=await c.json();}catch(error){console.warn("Proof ledger unavailable",error);}
    renderMetrics(metrics);renderEmployers(ledger);renderClaims(findings);
  }
  init();
})();
