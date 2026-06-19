(() => {
  "use strict";

  const STATES={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"};
  const LOCAL_MODE=window.JG_CONFIG?.mode==="local";
  const DEFAULT_METRICS={actual:{verified_registry_records:0,release_monitoring:0,candidate_intakes:0,profiles_submitted:0,public_profiles:0,employer_applications:0,verified_employers:0,open_jobs:0,matches:0,interviews:0,offers:0,career_starts:0,retained_90:0,retained_180:0,retained_365:0,advancement_events:0},targets_12_month:{verified_registry_records:250,candidate_intakes:500,profiles_submitted:350,public_profiles:100,verified_employers:50,open_jobs:100,matches:350,interviews:200,offers:125,career_starts:100,retained_90:85,retained_180:75,retained_365:50,advancement_events:30},updated_at:null};
  const $=(q,c=document)=>c.querySelector(q);
  const $$=(q,c=document)=>[...c.querySelectorAll(q)];
  const nice=n=>Number(n||0).toLocaleString("en-US");
  const human=v=>String(v||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
  const escapeHtml=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  let coverage=[];

  function toast(message){const el=$("#toast");if(!el)return;el.textContent=message;el.classList.add("show");window.setTimeout(()=>el.classList.remove("show"),4200);}

  function populateStates(){
    const options=Object.entries(STATES).map(([code,name])=>`<option value="${code}">${name}</option>`).join("");
    $$(".state-select").forEach(select=>{select.innerHTML=(select.classList.contains("optional-state")?'<option value="">Nationwide / not applicable</option>':'<option value="">Select a state</option>')+options;});
    const jobState=$("#jobState");if(jobState)jobState.innerHTML='<option value="">All states</option>'+options;
  }

  function openModal(name){
    const modal=$(`#${name}Modal`);if(!modal)return;
    $("#mobileMenu")?.classList.remove("open");$("#menuBtn")?.setAttribute("aria-expanded","false");
    modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.classList.add("modal-open");
    window.setTimeout(()=>$("input:not(.honeypot),select,textarea",modal)?.focus(),60);
  }
  function closeModal(modal){if(!modal)return;modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.classList.remove("modal-open");}
  window.openModal=openModal;

  document.addEventListener("click",event=>{
    const opener=event.target.closest("[data-open]");if(opener){event.preventDefault();openModal(opener.dataset.open);return;}
    const close=event.target.closest(".modal .close-btn");if(close){closeModal(close.closest(".modal-backdrop"));return;}
    if(event.target.classList?.contains("modal-backdrop"))closeModal(event.target);
  });
  document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;$$(".modal-backdrop.open").forEach(closeModal);$("#policyDrawer")?.classList.remove("open");});

  const menuButton=$("#menuBtn"),mobileMenu=$("#mobileMenu");
  menuButton?.addEventListener("click",()=>{const open=mobileMenu.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open));});
  $$("#mobileMenu a").forEach(link=>link.addEventListener("click",()=>{mobileMenu?.classList.remove("open");menuButton?.setAttribute("aria-expanded","false");}));

  function serialize(form){
    const data={};for(const [key,value] of new FormData(form).entries())data[key]=value;
    $$("input[type=checkbox]",form).forEach(input=>data[input.name]=input.checked);
    ["min_hourly_wage","roles_per_quarter","wage_min","wage_max"].forEach(key=>{if(key in data)data[key]=data[key]===""?null:Number(data[key]);});
    return data;
  }

  $$(".api-form").forEach(form=>form.addEventListener("submit",async event=>{
    event.preventDefault();
    const status=$(".form-status",form),button=$("button[type=submit]",form),label=button?.textContent||"Submit";
    if(status){status.className="form-status";status.textContent="";}if(button){button.disabled=true;button.textContent="Submitting…";}
    try{
      const response=await fetch(form.dataset.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(serialize(form))});
      let body={};try{body=await response.json();}catch(_){body={};}
      if(!response.ok){let detail=body.detail||"Submission failed.";if(Array.isArray(detail))detail=detail.map(item=>item.msg).join(" ");throw new Error(detail);}
      if(status){
        if(body.profile_portal_url)status.innerHTML=`<strong>${escapeHtml(body.message||"Your private Mobility Passport is ready.")}</strong><br><a class="btn btn-dark btn-sm" style="margin-top:12px" href="${escapeHtml(body.profile_portal_url)}">Open and save my secure Passport</a><p style="font-size:12px;margin:9px 0 0">This private link is equivalent to a password. Save it now. It never appears on a public profile.</p>`;
        else status.textContent=body.message||"Received.";
        status.classList.add("show","success");
      }
      form.reset();toast(`Saved${body.id?` · ${body.id}`:""}`);await Promise.allSettled([loadMetrics(),loadJobs(),loadTalent()]);
    }catch(error){if(status){status.textContent=error.message||"Unable to submit.";status.classList.add("show","error");}}
    finally{if(button){button.disabled=false;button.textContent=label;}}
  }));

  function renderMetrics(data=DEFAULT_METRICS){
    const actual=data.actual||DEFAULT_METRICS.actual,targets=data.targets_12_month||DEFAULT_METRICS.targets_12_month;
    $$("[data-metric]").forEach(el=>{el.textContent=nice(actual[el.dataset.metric]);});
    const updated=$("#updatedAt");if(updated)updated.textContent=data.updated_at?`${LOCAL_MODE?"Preview data":"Ledger"} updated ${new Date(data.updated_at).toLocaleString()}`:`${LOCAL_MODE?"Preview data unavailable":"Live data unavailable"} — showing zeros`;
    const targetDefs=[["Verified employers","verified_employers"],["Live paid roles","open_jobs"],["Interviews","interviews"],["Career starts","career_starts"],["Retained 180 days","retained_180"],["Advancement","advancement_events"]];
    const targetChart=$("#targetChart");if(targetChart)targetChart.innerHTML=targetDefs.map(([label,key])=>{const value=actual[key]||0,target=targets[key]||1,percent=Math.min(100,value/target*100);return `<div class="bar-row"><span class="bar-label">${label}</span><div class="bar-track" role="progressbar" aria-label="${label}: ${nice(value)} of ${nice(target)} target" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${value}"><span class="bar-target"></span><span class="bar-actual" style="width:${percent}%"></span></div><span class="bar-value">${nice(value)}</span></div>`;}).join("");
    const funnelDefs=[["Applications",actual.employer_applications],["Verified employers",actual.verified_employers],["Live paid roles",actual.open_jobs],["Interviews",actual.interviews],["Career starts",actual.career_starts],["Retained 180",actual.retained_180],["Advancement",actual.advancement_events]];
    const max=Math.max(1,...funnelDefs.map(([,value])=>value||0));
    const funnel=$("#funnelChart");if(funnel)funnel.innerHTML=funnelDefs.map(([label,value])=>`<div class="funnel-row"><div class="funnel-bar"><div class="funnel-fill" style="width:${Math.max(value?5:0,(value/max)*100)}%"></div><div class="funnel-name">${label}</div></div><span class="funnel-number">${nice(value)}</span></div>`).join("");
  }

  async function loadMetrics(){
    try{const response=await fetch("/api/public/metrics",{cache:"no-store"});if(!response.ok)throw new Error();const data=await response.json();renderMetrics(data);const status=$("#heroStatus");if(status)status.textContent=LOCAL_MODE?"Browser-test ledger connected":"Public ledger connected";return data;}
    catch(_){renderMetrics(DEFAULT_METRICS);const status=$("#heroStatus");if(status)status.textContent="Evidence infrastructure ready";return DEFAULT_METRICS;}
  }

  function coverageClass(status){return status==="priority_pilot"?"priority":status==="research_pilot"?"pilot":"queue";}
  function renderStateDetail(item){
    const el=$("#stateDetail");if(!el||!item)return;
    el.innerHTML=`<span class="state-status">${human(item.registry_status)}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.notes)}</p><div class="state-facts"><div class="state-fact"><span>Registry</span><strong>${human(item.registry_status)}</strong></div><div class="state-fact"><span>Career network</span><strong>${human(item.career_status)}</strong></div><div class="state-fact"><span>Pathway</span><strong>${human(item.legal_pathway)}</strong></div><div class="state-fact"><span>Sources mapped</span><strong>${nice(item.source_count)}</strong></div><div class="state-fact"><span>Review date</span><strong>${item.reviewed_at?new Date(item.reviewed_at).toLocaleDateString():"Pending"}</strong></div></div><p style="margin-top:20px;font-size:12px">Operational status is not legal advice. Role-specific restrictions require qualified review.</p>`;
  }
  async function loadCoverage(){
    if(!$("#stateGrid"))return;
    try{const response=await fetch("/api/public/coverage");const body=await response.json();coverage=body.items||[];}
    catch(_){coverage=Object.entries(STATES).map(([jurisdiction,name])=>({jurisdiction,name,registry_status:jurisdiction==="CA"?"priority_pilot":jurisdiction==="ID"?"research_pilot":"research_queue",career_status:"employer_recruiting",legal_pathway:"not_yet_reviewed",source_count:0,notes:"Connect the production API to load current coverage."}));}
    const grid=$("#stateGrid");grid.innerHTML="";
    coverage.filter(item=>item.jurisdiction!=="FED").forEach(item=>{const button=document.createElement("button");button.className=`state-btn ${coverageClass(item.registry_status)}`;button.textContent=item.jurisdiction;button.title=item.name;button.setAttribute("aria-label",`${item.name}: ${human(item.registry_status)}`);button.addEventListener("click",()=>{$$(".state-btn").forEach(b=>b.classList.remove("active"));button.classList.add("active");renderStateDetail(item);});grid.appendChild(button);});
    const initial=coverage.find(item=>item.jurisdiction==="CA")||coverage[0];const button=[...grid.children].find(item=>item.textContent===initial?.jurisdiction);button?.classList.add("active");renderStateDetail(initial);
  }

  function formatPay(job){const unit=job.salary_period==="year"?"/yr":job.salary_period==="project"?"/project":"/hr";const options={style:"currency",currency:"USD",maximumFractionDigits:job.salary_period==="hour"?2:0};const min=Number(job.wage_min).toLocaleString("en-US",options);const max=job.wage_max?`–${Number(job.wage_max).toLocaleString("en-US",options)}`:"";return `${min}${max}${unit}`;}
  async function loadJobs(){
    const list=$("#jobList");if(!list)return;
    const params=new URLSearchParams();if($("#jobState")?.value)params.set("state",$("#jobState").value);if($("#jobPathway")?.value)params.set("pathway",$("#jobPathway").value);if($("#jobRemote")?.checked)params.set("remote","true");
    try{
      const response=await fetch(`/api/public/jobs?${params}`,{cache:"no-store"});if(!response.ok)throw new Error();const body=await response.json();
      if(!body.items?.length){list.innerHTML='<div class="job-proof-empty"><span>Verified zero</span><h3>No role has met the proof standard yet.</h3><p>This is the public starting point—not filler. A listing must be open, funded, paid, reviewed, and tied to an accountable employer before it appears.</p><div class="cta-row"><button class="btn btn-dark" type="button" data-open="employer">Become the first verified employer</button><button class="btn btn-outline" type="button" data-open="claim">Submit a public hiring claim</button></div></div>';return;}
      list.innerHTML=body.items.map(job=>`<article class="job-card"><div><h3>${escapeHtml(job.title)}</h3><div class="job-meta"><span class="chip">${escapeHtml(job.org_name)}</span><span class="chip">${job.remote?"Remote":escapeHtml([job.city,job.state].filter(Boolean).join(", "))}</span><span class="chip">${human(job.pathway)}</span><span class="chip">${human(job.employment_type)}</span>${job.relocation_support?'<span class="chip">Relocation support</span>':""}</div></div><div><div class="job-comp">${formatPay(job)}</div><button class="text-link" type="button" data-open="candidate">Start matching</button></div></article>`).join("");
    }catch(_){toast("The job ledger is temporarily unavailable.");}
  }
  ["jobState","jobPathway","jobRemote"].forEach(id=>$("#"+id)?.addEventListener("change",loadJobs));

  async function loadRegistry(){
    const rows=$("#registryRows");if(!rows)return;
    try{const response=await fetch("/api/public/registry",{cache:"no-store"});const body=await response.json();if(!body.items?.length)return;rows.innerHTML=body.items.map(item=>`<div class="registry-row"><span>${escapeHtml(item.display_name||"Name withheld")}</span><span>${escapeHtml(item.jurisdiction)}</span><span>${human(item.custody_status)}</span><span>${new Date(item.last_verified_at).toLocaleDateString()}</span></div>`).join("");}catch(_){}
  }

  async function loadTalent(){
    const list=$("#talentList");if(!list)return;
    try{
      const [talentResponse,insightResponse]=await Promise.all([fetch("/api/public/talent",{cache:"no-store"}),fetch("/api/public/talent-insights",{cache:"no-store"})]);
      const talent=talentResponse.ok?await talentResponse.json():{items:[]};const insights=insightResponse.ok?await insightResponse.json():{suppressed:true,candidate_count:0,job_count:0};
      if(talent.items?.length)list.innerHTML=talent.items.slice(0,5).map(profile=>`<article class="talent-card"><div><h4>${escapeHtml(profile.display_name||"Justice Grows talent")}</h4><p>${escapeHtml(profile.headline||profile.goals_12_month||"Skills-first candidate")}</p></div><a href="./talent.html#slug=${encodeURIComponent(profile.slug)}">View →</a></article>`).join("");
      const chart=$("#roleGapChart"),stats=$("#mobilityStats"),copy=$("#mobilityCopy");
      if(insights.suppressed){if(chart)chart.innerHTML=`<div class="calm-empty calm-empty--compact"><strong>Waiting for ${nice(insights.minimum_group_size||10)} candidates.</strong><span>${escapeHtml(insights.message||"Small cohorts stay suppressed.")}</span></div>`;if(stats)stats.textContent=`${nice(insights.candidate_count||0)} candidate${insights.candidate_count===1?"":"s"}`;if(copy)copy.textContent=`${nice(insights.job_count||0)} approved open roles · detailed breakdowns remain protected.`;}
      else{const rows=insights.role_gap||[],max=Math.max(1,...rows.map(row=>Math.max(row.candidates,row.open_jobs)));if(chart)chart.innerHTML=rows.length?rows.slice(0,6).map(row=>`<div class="micro-row"><span>${escapeHtml(human(row.role))}</span><div class="micro-track"><div class="micro-fill" style="width:${Math.max(3,row.candidates/max*100)}%"></div></div><b>${nice(row.candidates)}/${nice(row.open_jobs)}</b></div>`).join(""):'<div class="calm-empty calm-empty--compact"><strong>No role demand yet.</strong><span>Verified candidate and job data will populate this view.</span></div>';if(stats)stats.textContent=`${nice(insights.mobility?.remote_ready||0)} remote-ready`;if(copy)copy.textContent=`${nice(insights.mobility?.relocation_open||0)} open to relocation across ${nice(insights.mobility?.total||0)} active candidates.`;}
    }catch(error){console.warn("Talent network unavailable",error);}
  }

  const policyCopy={
    privacy:'<span class="eyebrow">Trust policy</span><h2>Privacy by architecture</h2><p><strong>Effective June 19, 2026.</strong> Justice Grows separates public registry research from private career intake. Candidate data is not sold, rented, or exposed as a searchable conviction marketplace.</p><h3>Candidate control</h3><p>A Mobility Passport starts private. A candidate controls visibility and every employer introduction. A job application never grants marketing rights to a person’s story, image, identity, or conviction history.</p><h3>Production boundary</h3><p>The GitHub Pages release is a browser-local acceptance test. Real intake requires the separate secure data plane, named accounts, MFA, access controls, encryption, monitoring, retention rules, and incident response.</p>',
    terms:'<span class="eyebrow">Platform terms</span><h2>Terms of participation</h2><p>Justice Grows does not promise release, employment, licensing, record relief, relocation, or legal outcomes. Information is not legal advice. Employers remain responsible for lawful, role-specific decisions.</p><h3>Prohibited conduct</h3><ul><li>Harassment, surveillance, adverse screening, scraping, or re-identification.</li><li>Charging candidates for access or placement.</li><li>Coercing a candidate to make a public story part of hiring.</li><li>Buying rankings, proof levels, or verification speed.</li></ul>',
    methodology:'<span class="eyebrow">Evidence standard</span><h2>Claims are signals. Outcomes are proof.</h2><p>Applications, policies, live roles, introductions, starts, retention, advancement, and ownership remain separate events. A company earns only the highest proof level supported by reviewed evidence.</p><h3>Registry standard</h3><p>Publication requires identity resolution, current commitment review, cannabis attribution, current custody or release verification, dated source provenance, and two independent reviewers.</p>',
    corrections:'<span class="eyebrow">Accountability</span><h2>Corrections and right of reply</h2><p>Any person, attorney, family member, agency, employer, or researcher may report an error. Credible high-risk disputes trigger a field freeze and expedited review. Material company conclusions require evidence review and a documented response opportunity.</p>'
  };
  document.addEventListener("click",event=>{const button=event.target.closest("[data-policy]");if(!button)return;const drawer=$("#policyDrawer"),content=$("#policyContent");if(content)content.innerHTML=policyCopy[button.dataset.policy]||"";drawer?.classList.add("open");});
  $("#closePolicy")?.addEventListener("click",()=>$("#policyDrawer")?.classList.remove("open"));
  $("#policyDrawer")?.addEventListener("click",event=>{if(event.target===$("#policyDrawer"))$("#policyDrawer").classList.remove("open");});
  $("#refreshMetrics")?.addEventListener("click",loadMetrics);
  if($("#year"))$("#year").textContent=new Date().getFullYear();

  populateStates();
  const requestedModal=new URLSearchParams(window.location.search).get("open");
  if(["candidate","employer","job","case","claim","partner","correction"].includes(requestedModal)){
    window.setTimeout(()=>openModal(requestedModal),80);
    try{const clean=new URL(window.location.href);clean.searchParams.delete("open");window.history.replaceState({},"",clean.pathname+clean.search+clean.hash);}catch(_){}
  }
  Promise.allSettled([loadMetrics(),loadCoverage(),loadJobs(),loadRegistry(),loadTalent()]);
})();
