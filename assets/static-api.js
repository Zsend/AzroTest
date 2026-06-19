/* Justice Grows static API bridge
 * ------------------------------------------------------------
 * GitHub Pages is static hosting. This bridge gives the full UI a
 * browser-local test database and can proxy the exact same API calls
 * to a production Edge Function when JG_CONFIG.mode === "edge".
 *
 * Local mode is deliberately non-production: data is stored unencrypted
 * in localStorage and is visible only in the current browser profile.
 */
(function () {
  "use strict";

  const cfg = window.JG_CONFIG || {};
  const nativeFetch = window.fetch.bind(window);
  const KEY = cfg.localStorageKey || "justice_grows_github_pages_v1";
  const MIN_GROUP = Math.max(3, Number(cfg.aggregatePrivacyMinimum || 10));
  const ADMIN_TOKEN = cfg.adminTestToken || "pilot-admin";
  const memoryMap = new Map();
  const memoryStorage = {
    getItem(key) { return memoryMap.has(String(key)) ? memoryMap.get(String(key)) : null; },
    setItem(key, value) { memoryMap.set(String(key), String(value)); },
    removeItem(key) { memoryMap.delete(String(key)); },
    clear() { memoryMap.clear(); },
    key(index) { return [...memoryMap.keys()][index] || null; },
    get length() { return memoryMap.size; }
  };
  let storage = memoryStorage;
  let storageKind = "memory";
  try {
    const probe = `${KEY}__probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    storage = window.localStorage;
    storageKind = "localStorage";
  } catch (_) {
    // Some privacy modes disable localStorage. The test UI still works in-memory,
    // but data will not persist after the page closes or reloads.
  }

  const STATE_NAMES = {
    AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"
  };

  const now = () => new Date().toISOString();
  const dateOnly = () => now().slice(0, 10);
  const id = prefix => `${prefix}_${cryptoRandom(16)}`;
  const token = () => cryptoRandom(48);
  const copy = value => JSON.parse(JSON.stringify(value));
  const asArray = value => {
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    return String(value || "").split(/[,;\n]/).map(v => v.trim()).filter(Boolean);
  };
  const normalized = value => [...new Set(asArray(value).map(v => v.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")).filter(Boolean))];
  const lines = value => [...new Set(asArray(value))];
  const bool = value => value === true || value === 1 || value === "1" || value === "true" || value === "on" || value === "yes";
  const numberOrNull = value => value === null || value === undefined || value === "" ? null : Number(value);
  const slugify = value => String(value || "talent").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "talent";

  function cryptoRandom(length) {
    const bytes = new Uint8Array(Math.ceil(length * 0.75) + 6);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, b => b.toString(36).padStart(2, "0")).join("").slice(0, length);
  }

  function baseFileUrl(file) {
    const href = /^https?:/i.test(window.location.href) ? window.location.href : (cfg.siteUrl || "https://zsend.github.io/AzroTest/");
    const current = new URL(href);
    const path = current.pathname.endsWith("/") ? current.pathname : current.pathname.replace(/[^/]*$/, "");
    current.pathname = path + file;
    current.search = "";
    current.hash = "";
    return current.toString();
  }

  function defaultCoverage() {
    const rows = Object.entries(STATE_NAMES).map(([jurisdiction, name]) => {
      let registry_status = "research_queue";
      let career_status = "employer_recruiting";
      let legal_pathway = "not_yet_reviewed";
      let notes = "Launch queue. No completeness claim is made until an authoritative source and review workflow are operational.";
      if (jurisdiction === "CA") {
        registry_status = "priority_pilot";
        legal_pathway = "source_mapping";
        notes = "Priority pilot for recurring corrections records, court verification, release monitoring, and employer recruitment.";
      } else if (jurisdiction === "ID") {
        registry_status = "research_pilot";
        legal_pathway = "mobility_route_design";
        notes = "Mobility pilot focused on lawful ancillary work, remote roles, training, relocation choice, and individualized legal review.";
      }
      return { jurisdiction, name, registry_status, career_status, legal_pathway, source_count: 0, source_urls: [], reviewed_at: null, notes };
    });
    rows.unshift({ jurisdiction: "FED", name: "Federal system", registry_status: "priority_pilot", career_status: "employer_recruiting", legal_pathway: "source_mapping", source_count: 0, source_urls: [], reviewed_at: null, notes: "Federal pilot for BOP status monitoring, court judgments, and sentence verification." });
    return rows;
  }

  function emptyDb() {
    return {
      version: 1,
      created_at: now(),
      updated_at: now(),
      candidates: [], profiles: [], employers: [], jobs: [], cases: [], corrections: [], partners: [],
      registry: [], registry_sources: [], registry_reviews: [], matches: [], outcomes: [],
      coverage: defaultCoverage(), audit: []
    };
  }

  function loadDb() {
    try {
      const parsed = JSON.parse(storage.getItem(KEY) || "null");
      if (!parsed || parsed.version !== 1) return emptyDb();
      const fresh = emptyDb();
      Object.keys(fresh).forEach(k => { if (parsed[k] === undefined) parsed[k] = fresh[k]; });
      return parsed;
    } catch (_) {
      return emptyDb();
    }
  }

  function saveDb(db) {
    db.updated_at = now();
    storage.setItem(KEY, JSON.stringify(db));
    window.dispatchEvent(new CustomEvent("jg:data-changed", { detail: { updated_at: db.updated_at } }));
  }

  function audit(db, actor, action, entity, entityId, detail) {
    db.audit.unshift({ id: id("aud"), actor, action, entity, entity_id: entityId, detail: detail || null, created_at: now() });
    db.audit = db.audit.slice(0, 1000);
  }

  function response(payload, status, headers) {
    const isString = typeof payload === "string";
    return Promise.resolve(new Response(isString ? payload : JSON.stringify(payload), {
      status: status || 200,
      headers: Object.assign({ "Content-Type": isString ? "text/plain; charset=utf-8" : "application/json; charset=utf-8", "Cache-Control": "no-store" }, headers || {})
    }));
  }

  function error(detail, status) { return response({ detail }, status || 400); }

  function parseBody(init) {
    if (!init || init.body === undefined || init.body === null || init.body === "") return {};
    if (typeof init.body === "string") {
      try { return JSON.parse(init.body); } catch (_) { return {}; }
    }
    return init.body;
  }

  function getHeader(init, name) {
    const headers = new Headers((init && init.headers) || {});
    return headers.get(name) || "";
  }

  function requireAdmin(init) {
    const auth = getHeader(init, "Authorization").replace(/^Bearer\s+/i, "");
    return auth && auth === ADMIN_TOKEN;
  }

  function candidateIdentity(db, init) {
    const access = getHeader(init, "Authorization").replace(/^Bearer\s+/i, "");
    if (!access) return null;
    const profile = db.profiles.find(p => p.access_token === access);
    if (!profile) return null;
    const candidate = db.candidates.find(c => c.id === profile.candidate_id);
    return candidate ? { candidate, profile } : null;
  }

  function profileCompletion(profile) {
    const weighted = { headline:10, about:15, work_history:15, goals_12_month:15, ambition_3_year:10, skills:15, role_interests:10, strengths:5, certifications:3, portfolio_links:2 };
    return Object.entries(weighted).reduce((sum, [key, weight]) => {
      const value = profile[key];
      const present = Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());
      return sum + (present ? weight : 0);
    }, 0);
  }

  function publicSnapshot(profile, candidate) {
    return {
      slug: profile.slug,
      display_name: profile.display_name,
      headline: profile.headline,
      about: profile.about,
      work_history: profile.work_history,
      goals_12_month: profile.goals_12_month,
      ambition_3_year: profile.ambition_3_year,
      strengths: copy(profile.strengths || []),
      skills: copy(profile.skills || []),
      role_interests: copy(profile.role_interests || []),
      certifications: copy(profile.certifications || []),
      training_interests: copy(profile.training_interests || []),
      portfolio_links: copy(profile.portfolio_links || []).filter(x => /^https:\/\//i.test(x)),
      preferred_locations: copy(profile.preferred_locations || []),
      schedule_preferences: copy(profile.schedule_preferences || []),
      languages: copy(profile.languages || []),
      state: candidate.state,
      remote_ok: Boolean(candidate.remote_ok),
      relocation_ok: Boolean(candidate.relocation_ok),
      updated_at: profile.updated_at
    };
  }

  function scoreMatch(candidate, job) {
    const candidateRoles = new Set(candidate.role_interests || []);
    const candidateSkills = new Set(candidate.skills || []);
    const candidatePathways = new Set(candidate.pathways || []);
    const jobRoles = new Set(job.role_interests || []);
    const jobSkills = new Set(job.skills || []);
    const overlap = (a, b) => [...a].filter(x => b.has(x));
    const roleOverlap = overlap(candidateRoles, jobRoles);
    const skillOverlap = overlap(candidateSkills, jobSkills);
    let score = 0;
    const reasons = [], blockers = [];

    if (roleOverlap.length) { score += Math.min(35, 15 + 10 * roleOverlap.length); reasons.push("Role interests align"); }
    else if (candidateRoles.size && jobRoles.size) blockers.push("Role interest needs review");
    else score += 8;

    if (skillOverlap.length) { score += Math.min(30, 10 + 5 * skillOverlap.length); reasons.push(`${skillOverlap.length} skill match${skillOverlap.length === 1 ? "" : "es"}`); }
    else if (jobSkills.size) blockers.push("Required skills need review");
    else score += 10;

    if (candidate.state === job.state) { score += 18; reasons.push("Same-state opportunity"); }
    else if (job.remote && candidate.remote_ok) { score += 18; reasons.push("Remote preference aligns"); }
    else if (candidate.relocation_ok && job.relocation_support) { score += 15; reasons.push("Relocation support aligns"); }
    else blockers.push("Location needs review");

    if (!candidatePathways.size || candidatePathways.has(job.pathway)) { score += 8; reasons.push("Career pathway aligns"); }

    if (job.salary_period === "hour" && candidate.min_hourly_wage !== null && candidate.min_hourly_wage !== undefined) {
      if (job.wage_max !== null && job.wage_max !== undefined && Number(job.wage_max) < Number(candidate.min_hourly_wage)) { score -= 25; blockers.push("Compensation below stated minimum"); }
      else if (Number(job.wage_min) >= Number(candidate.min_hourly_wage)) { score += 9; reasons.push("Compensation meets preference"); }
      else score += 3;
    } else score += 4;

    return { score: Math.max(0, Math.min(100, Math.round(score * 10) / 10)), reasons, blockers };
  }

  function refreshMatches(db, candidateId, jobId) {
    const candidates = db.candidates.filter(c => c.consent_matching && !["withdrawn", "deleted"].includes(c.status) && (!candidateId || c.id === candidateId));
    const jobs = db.jobs.filter(j => j.status === "published" && (!jobId || j.id === jobId));
    let count = 0;
    candidates.forEach(candidate => jobs.forEach(job => {
      const scored = scoreMatch(candidate, job);
      if (scored.score < 25) return;
      let match = db.matches.find(m => m.candidate_id === candidate.id && m.job_id === job.id);
      if (!match) {
        match = { id:id("mat"), candidate_id:candidate.id, job_id:job.id, stage:"suggested", candidate_consent:false, created_at:now() };
        db.matches.push(match);
      }
      Object.assign(match, scored, { updated_at: now() });
      count += 1;
    }));
    return count;
  }

  function metrics(db) {
    const stageAtLeast = stages => db.matches.filter(m => stages.includes(m.stage)).length;
    const actual = {
      verified_registry_records: db.registry.filter(r => r.publication_status === "published").length,
      release_monitoring: db.registry.filter(r => r.publication_status === "published" && ["incarcerated", "release_pending"].includes(r.custody_status)).length,
      candidate_intakes: db.candidates.filter(c => !["deleted", "withdrawn"].includes(c.status)).length,
      profiles_submitted: db.profiles.filter(p => ["submitted", "published", "changes_requested"].includes(p.status)).length,
      public_profiles: db.profiles.filter(p => p.status === "published" && p.visibility === "public" && p.public_snapshot).length,
      employer_applications: db.employers.length,
      verified_employers: db.employers.filter(e => ["verified", "proven"].includes(e.status)).length,
      open_jobs: db.jobs.filter(j => j.status === "published").length,
      matches: db.matches.length,
      interviews: stageAtLeast(["interview", "offer", "started", "retained_90", "retained_180", "retained_365"]),
      offers: stageAtLeast(["offer", "started", "retained_90", "retained_180", "retained_365"]),
      career_starts: stageAtLeast(["started", "retained_90", "retained_180", "retained_365"]),
      retained_180: stageAtLeast(["retained_180", "retained_365"]),
      average_starting_hourly_wage: null
    };
    const wages = db.outcomes.filter(o => o.event_type === "started" && o.salary_period === "hour" && Number.isFinite(Number(o.wage))).map(o => Number(o.wage));
    if (wages.length) actual.average_starting_hourly_wage = Math.round((wages.reduce((a,b)=>a+b,0) / wages.length) * 100) / 100;
    return {
      mode: "local-test",
      updated_at: db.updated_at,
      actual,
      targets_12_month: { verified_registry_records:250, release_monitoring:200, candidate_intakes:500, profiles_submitted:350, public_profiles:100, verified_employers:50, open_jobs:150, matches:350, interviews:200, offers:125, career_starts:100, retained_180:75 },
      coverage: Object.entries(db.coverage.reduce((acc, row) => { acc[row.registry_status] = (acc[row.registry_status] || 0) + 1; return acc; }, {})).map(([status,count]) => ({status,count})),
      disclosure: "Local browser-test metrics are computed only from data entered in this browser. Targets are labeled separately and are never reported as outcomes."
    };
  }

  function publicJobs(db, params) {
    let items = db.jobs.filter(j => j.status === "published" && (!j.expires_at || j.expires_at >= dateOnly()));
    if (params.get("state")) items = items.filter(j => j.state === params.get("state").toUpperCase());
    if (params.get("pathway")) items = items.filter(j => j.pathway === params.get("pathway"));
    if (params.has("remote")) items = items.filter(j => Boolean(j.remote) === (params.get("remote") === "true"));
    return items.map(job => {
      const employer = db.employers.find(e => e.id === job.employer_id);
      return Object.assign({}, copy(job), { org_name: employer ? employer.org_name : (job.submitted_org_name || "Verified employer"), employer_status: employer ? employer.status : "verified" });
    }).sort((a,b) => String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)));
  }

  function candidateProfilePayload(profile, candidate) {
    return Object.assign({}, copy(profile), {
      state: candidate.state,
      remote_ok: Boolean(candidate.remote_ok),
      relocation_ok: Boolean(candidate.relocation_ok),
      availability_date: candidate.availability_date,
      min_hourly_wage: candidate.min_hourly_wage,
      completion: profileCompletion(profile),
      public_url: profile.public_snapshot ? `${baseFileUrl("talent.html")}#slug=${encodeURIComponent(profile.slug)}` : null
    });
  }

  function adminQueue(db, kind) {
    if (kind === "candidates") return copy(db.candidates);
    if (kind === "profiles") return db.profiles.map(p => {
      const c = db.candidates.find(x => x.id === p.candidate_id) || {};
      return Object.assign({}, copy(p), { state: c.state, remote_ok: c.remote_ok, relocation_ok: c.relocation_ok, min_hourly_wage: c.min_hourly_wage });
    });
    if (kind === "employers") return copy(db.employers);
    if (kind === "jobs") return copy(db.jobs);
    if (kind === "cases") return copy(db.cases);
    if (kind === "corrections") return copy(db.corrections);
    if (kind === "partners") return copy(db.partners);
    if (kind === "matches") return copy(db.matches);
    if (kind === "registry") return db.registry.map(r => Object.assign({}, copy(r), {
      sources: db.registry_sources.filter(s => s.registry_id === r.id),
      reviews: db.registry_reviews.filter(v => v.registry_id === r.id)
    }));
    return [];
  }

  function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function toCsv(items) {
    if (!items.length) return "id\n";
    const headers = [...new Set(items.flatMap(item => Object.keys(item)))];
    return [headers.join(","), ...items.map(item => headers.map(h => csvEscape(item[h])).join(","))].join("\n");
  }

  async function localRoute(path, params, init) {
    const method = String((init && init.method) || "GET").toUpperCase();
    const body = parseBody(init);
    const db = loadDb();

    if (path === "/api/health" && method === "GET") return response({ status:"ok", service:"justice-grows-static", environment:"local-test", database:storageKind, admin_enabled:true, time:now() });

    if (path === "/api/public/metrics" && method === "GET") return response(metrics(db));
    if (path === "/api/public/coverage" && method === "GET") return response({ items:copy(db.coverage), updated_at:db.updated_at });
    if (path === "/api/public/jobs" && method === "GET") { const items = publicJobs(db, params); return response({ items, count:items.length, updated_at:db.updated_at }); }
    if (path === "/api/public/registry" && method === "GET") {
      let items = db.registry.filter(r => r.publication_status === "published");
      if (params.get("state")) items = items.filter(r => r.state === params.get("state").toUpperCase());
      items = items.map(r => ({ id:r.id, display_name:r.display_name, jurisdiction:r.jurisdiction, state:r.state, custody_status:r.custody_status, cannabis_classification:r.cannabis_classification, violence_screen_statement:r.violence_screen_statement, confidence:r.confidence, source_count:r.source_count || 0, last_verified_at:r.last_verified_at, projected_release_date:r.projected_release_date, release_date:r.release_date }));
      return response({ items, count:items.length, updated_at:db.updated_at });
    }
    if (path === "/api/public/talent" && method === "GET") {
      const items = db.profiles.filter(p => p.status === "published" && p.visibility === "public" && p.public_snapshot).map(p => Object.assign({}, copy(p.public_snapshot), { published_at:p.published_at, updated_at:p.updated_at }));
      return response({ items, count:items.length, updated_at:db.updated_at, privacy_note:"These candidates affirmatively chose public visibility. Contact details and conviction records are never published in talent profiles." });
    }
    if (/^\/api\/public\/talent\//.test(path) && method === "GET") {
      const slug = decodeURIComponent(path.replace(/^\/api\/public\/talent\//, ""));
      const p = db.profiles.find(x => x.slug === slug && x.status === "published" && x.visibility === "public" && x.public_snapshot);
      if (!p) return error("Public talent profile not found.", 404);
      return response({ item:Object.assign({}, copy(p.public_snapshot), { published_at:p.published_at, updated_at:p.updated_at }), privacy_note:"This is a voluntary skills-first profile. Justice Grows does not publish conviction details or direct contact information here." });
    }
    if (path === "/api/public/employers" && method === "GET") {
      const items = db.employers.filter(e => ["verified","proven"].includes(e.status) && e.public_name_consent).map(e => ({ org_name:e.org_name, website:e.website, state:e.state, org_type:e.org_type, states_hiring:e.states_hiring, pathways:e.pathways, status:e.status, updated_at:e.updated_at }));
      return response({ items, count:items.length, updated_at:db.updated_at });
    }
    if (path === "/api/public/talent-insights" && method === "GET") {
      const candidates = db.candidates.filter(c => !["deleted","withdrawn"].includes(c.status));
      const jobs = db.jobs.filter(j => j.status === "published");
      if (candidates.length < MIN_GROUP) return response({ suppressed:true, minimum_group_size:MIN_GROUP, candidate_count:candidates.length, job_count:jobs.length, message:`Talent breakdowns appear after at least ${MIN_GROUP} active candidates, protecting early participants from re-identification.`, updated_at:db.updated_at });
      const cRoles = {}, jRoles = {}, cSkills = {};
      candidates.forEach(c => { (c.role_interests||[]).forEach(x=>cRoles[x]=(cRoles[x]||0)+1); (c.skills||[]).forEach(x=>cSkills[x]=(cSkills[x]||0)+1); });
      jobs.forEach(j => (j.role_interests||[]).forEach(x=>jRoles[x]=(jRoles[x]||0)+1));
      const keys = [...new Set([...Object.keys(cRoles),...Object.keys(jRoles)])].sort((a,b)=>(cRoles[b]||0)-(cRoles[a]||0)).slice(0,12);
      const role_gap = keys.filter(k => (cRoles[k]||0)>=3 || (jRoles[k]||0)>=3).map(role => ({ role, candidates:cRoles[role]||0, open_jobs:jRoles[role]||0 }));
      const top_skills = Object.entries(cSkills).filter(([,count])=>count>=3).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([skill,count])=>({skill,count}));
      const pay = candidates.map(c=>Number(c.min_hourly_wage)).filter(Number.isFinite);
      return response({ suppressed:false, minimum_group_size:MIN_GROUP, candidate_count:candidates.length, job_count:jobs.length, role_gap, top_skills, mobility:{remote_ready:candidates.filter(c=>c.remote_ok).length,relocation_open:candidates.filter(c=>c.relocation_ok).length,total:candidates.length}, average_stated_hourly_floor:pay.length>=MIN_GROUP?Math.round(pay.reduce((a,b)=>a+b,0)/pay.length*100)/100:null, updated_at:db.updated_at, disclosure:"Small groups are suppressed. Counts describe stated preferences, not guaranteed eligibility or hiring outcomes." });
    }

    if (path === "/api/intake/candidate" && method === "POST") {
      if (body.website_confirm) return response({ status:"received", message:"Received." }, 201);
      if (!bool(body.privacy_acknowledgment) || !bool(body.consent_contact)) return error("Privacy acknowledgment and contact consent are required.", 422);
      if (!body.first_name || !body.last_name || !body.email || !body.state || !body.release_status) return error("Complete all required candidate fields.", 422);
      const candidateId = id("can"), profileId = id("pro"), access = token();
      const displayName = `${String(body.first_name).trim()} ${String(body.last_name).trim().slice(0,1)}.`;
      const candidate = {
        id:candidateId, first_name:String(body.first_name).trim(), last_name:String(body.last_name).trim(), email:String(body.email).trim().toLowerCase(), phone:body.phone||null,
        state:String(body.state).toUpperCase(), city:body.city||null, release_status:body.release_status, availability_date:body.availability_date||null,
        role_interests:normalized(body.role_interests), skills:normalized(body.skills), pathways:normalized(body.pathways), needs:normalized(body.needs),
        min_hourly_wage:numberOrNull(body.min_hourly_wage), remote_ok:bool(body.remote_ok), relocation_ok:bool(body.relocation_ok), consent_matching:bool(body.consent_matching), consent_contact:true,
        notes:body.notes||null, status:"new", source:"self_intake", created_at:now(), updated_at:now()
      };
      const profile = {
        id:profileId, candidate_id:candidateId, slug:`${slugify(displayName)}-${candidateId.slice(-6)}`, access_token:access,
        display_name:displayName, identity_mode:"first_initial", headline:"", about:"", work_history:"", goals_12_month:"", ambition_3_year:"", strengths:[], skills:copy(candidate.skills), role_interests:copy(candidate.role_interests), certifications:[], training_interests:[], portfolio_links:[], preferred_locations:[], schedule_preferences:[], languages:[], story_consent:false,
        visibility:"private", status:"draft", pending_review:false, search_discovery:false, public_consent_at:null, public_snapshot:null, moderation_notes:null, created_at:now(), updated_at:now()
      };
      db.candidates.push(candidate); db.profiles.push(profile);
      const matchCount = candidate.consent_matching ? refreshMatches(db, candidateId, null) : 0;
      audit(db,"public","candidate.created","candidate",candidateId,{state:candidate.state,match_count:matchCount}); saveDb(db);
      return response({ id:candidateId,status:"received",match_suggestions:matchCount,profile_id:profileId,profile_portal_url:`${baseFileUrl("passport.html")}#access=${encodeURIComponent(access)}`,message:"Your private career intake and Mobility Passport are ready. Save the secure profile link now; nothing becomes public without your separate choice and staff review." },201);
    }

    if (path === "/api/intake/employer" && method === "POST") {
      const commitments = ["wage_transparency","no_blanket_ban","fair_chance_process","outcome_reporting","candidate_privacy","advancement_commitment"];
      if (!commitments.every(k=>bool(body[k]))) return error("All core Fair Chance Employer Compact commitments are required.",422);
      if (!body.org_name || !body.state || !body.first_name || !body.last_name || !body.email) return error("Complete all required employer fields.",422);
      const employer = { id:id("emp"), org_name:String(body.org_name).trim(), website:body.website||null, state:String(body.state).toUpperCase(), org_type:body.org_type||"other", employee_count:body.employee_count||null, roles_per_quarter:Number(body.roles_per_quarter||0), states_hiring:asArray(body.states_hiring).map(x=>x.toUpperCase()).filter(x=>STATE_NAMES[x]), pathways:normalized(body.pathways), first_name:body.first_name,last_name:body.last_name,title:body.title||null,email:String(body.email).toLowerCase(),phone:body.phone||null,notes:body.notes||null, wage_transparency:true,no_blanket_ban:true,fair_chance_process:true,outcome_reporting:true,candidate_privacy:true,advancement_commitment:true,public_name_consent:bool(body.public_name_consent),status:"applied",verification_notes:null,created_at:now(),updated_at:now() };
      if (!employer.states_hiring.length) employer.states_hiring=[employer.state];
      db.employers.push(employer); audit(db,"public","employer.applied","employer",employer.id,{state:employer.state}); saveDb(db);
      return response({id:employer.id,status:"applied",message:`Application saved. Your test employer reference is ${employer.id}. Use it when submitting a role.`},201);
    }

    if (path === "/api/intake/job" && method === "POST") {
      if (!bool(body.compact_acknowledgment)) return error("Employer Compact acknowledgment is required.",422);
      if (!body.org_name || !body.contact_name || !body.email || !body.title || !body.state || !body.pathway || !body.employment_type || body.wage_min === undefined || !body.description || !body.background_process) return error("Complete all required role fields.",422);
      if (body.salary_period === "hour" && Number(body.wage_min) < 7.25) return error("Hourly compensation must meet applicable wage law; entries below the federal floor are not accepted.",422);
      const job = { id:id("job"), employer_id:body.employer_id||null, submitted_org_name:String(body.org_name).trim(), contact_name:body.contact_name,email:String(body.email).toLowerCase(),phone:body.phone||null,title:String(body.title).trim(),city:body.city||null,state:String(body.state).toUpperCase(),remote:bool(body.remote),relocation_support:bool(body.relocation_support),pathway:body.pathway,employment_type:body.employment_type,wage_min:Number(body.wage_min),wage_max:numberOrNull(body.wage_max),salary_period:body.salary_period||"hour",benefits:normalized(body.benefits),skills:normalized(body.skills),role_interests:normalized(body.role_interests),description:String(body.description).trim(),licensing_notes:body.licensing_notes||null,background_process:String(body.background_process).trim(),status:"submitted",published_at:null,expires_at:null,created_at:now(),updated_at:now() };
      if (job.employer_id && !db.employers.find(e=>e.id===job.employer_id)) return error("Employer ID was not found. Submit an employer application first or leave it blank.",422);
      db.jobs.push(job); audit(db,"public","job.submitted","job",job.id,{state:job.state,pathway:job.pathway}); saveDb(db);
      return response({id:job.id,status:"submitted",message:"The role is saved for verification. Jobs are published only after employer, compensation, licensing, and fair-chance review."},201);
    }

    if (path === "/api/intake/case" && method === "POST") {
      if (!bool(body.accuracy_acknowledgment)) return error("Accuracy acknowledgment is required.",422);
      const record = Object.assign({id:id("ref"),status:"triage",created_at:now(),updated_at:now()},copy(body));
      db.cases.push(record); audit(db,"public","case.referred","case_referral",record.id,{state:record.state,custody_system:record.custody_system}); saveDb(db);
      return response({id:record.id,status:"triage",message:"The referral is saved in a private review queue. No person is published from a referral alone."},201);
    }

    if (path === "/api/intake/correction" && method === "POST") {
      if (!bool(body.contact_consent) || !bool(body.accuracy_acknowledgment)) return error("Contact consent and accuracy acknowledgment are required.",422);
      const record = Object.assign({id:id("cor"),status:"new",resolution_note:null,created_at:now(),updated_at:now()},copy(body));
      db.corrections.push(record); audit(db,"public","correction.created","correction_request",record.id,{type:record.correction_type}); saveDb(db);
      return response({id:record.id,status:"received",message:"The correction request is in the evidence review queue. Public records are not changed automatically."},201);
    }

    if (path === "/api/intake/partner" && method === "POST") {
      if (!bool(body.contact_consent)) return error("Contact consent is required.",422);
      const record = Object.assign({id:id("par"),status:"new",support_offered:normalized(body.support_offered),created_at:now(),updated_at:now()},copy(body));
      db.partners.push(record); audit(db,"public","partner.created","partner",record.id,{partner_type:record.partner_type}); saveDb(db);
      return response({id:record.id,status:"received",message:"Partnership inquiry saved."},201);
    }

    if (path.startsWith("/api/candidate/")) {
      const identity = candidateIdentity(db, init);
      if (!identity) return error("Secure Mobility Passport access key is invalid or expired.",401);
      const candidate = identity.candidate, profile = identity.profile;

      if (path === "/api/candidate/profile" && method === "GET") return response({ profile:candidateProfilePayload(profile,candidate), updated_at:profile.updated_at });
      if (path === "/api/candidate/profile" && method === "PUT") {
        if (body.visibility === "public" && !bool(body.public_profile_consent)) return error("Separate public-profile consent is required for public visibility.",422);
        if (bool(body.search_discovery) && body.visibility !== "public") return error("Search discovery is available only for public profiles.",422);
        ["display_name","identity_mode","headline","about","work_history","goals_12_month","ambition_3_year","visibility"].forEach(k=>{ if(body[k]!==undefined) profile[k]=body[k]; });
        ["strengths","skills","role_interests","certifications","training_interests","preferred_locations","schedule_preferences","languages"].forEach(k=>{ if(body[k]!==undefined) profile[k]=k==="skills"||k==="role_interests"?normalized(body[k]):lines(body[k]); });
        if (body.portfolio_links !== undefined) profile.portfolio_links=lines(body.portfolio_links).filter(x=>/^https:\/\//i.test(x));
        profile.story_consent=bool(body.story_consent); profile.search_discovery=bool(body.search_discovery);
        if (body.visibility === "public" && bool(body.public_profile_consent)) profile.public_consent_at=now();
        if (body.visibility !== "public") { profile.public_snapshot=null; profile.published_at=null; if(body.visibility==="private") profile.pending_review=false; }
        if (profile.status === "published" && ["public","coalition"].includes(profile.visibility)) profile.pending_review=true; else if(profile.status!=="published") profile.status="draft";
        candidate.skills=copy(profile.skills); candidate.role_interests=copy(profile.role_interests); candidate.updated_at=now(); profile.updated_at=now();
        const refreshed=refreshMatches(db,candidate.id,null); audit(db,"candidate","profile.updated","candidate_profile",profile.id,{visibility:profile.visibility,completion:profileCompletion(profile),matches_refreshed:refreshed}); saveDb(db);
        return response({status:"saved",completion:profileCompletion(profile),pending_review:Boolean(profile.pending_review),matches_refreshed:refreshed,message:"Mobility Passport saved. Public or coalition visibility still requires moderation before a new snapshot is shared."});
      }
      if (path === "/api/candidate/profile/submit" && method === "POST") {
        if (!bool(body.acknowledgment)) return error("Accuracy and consent acknowledgment is required.",422);
        const completion=profileCompletion(profile);
        if (completion<50 || !(profile.skills||[]).length || !(profile.role_interests||[]).length) return error("Complete at least 50% of the profile, including skills and target roles, before review.",409);
        if (profile.visibility==="public" && !profile.public_consent_at) return error("Public-profile consent is missing.",409);
        profile.status=profile.status==="published"?"published":"submitted"; profile.pending_review=true; profile.submitted_at=now(); profile.updated_at=now(); profile.moderation_notes=null;
        audit(db,"candidate","profile.submitted","candidate_profile",profile.id,{visibility:profile.visibility,completion}); saveDb(db);
        return response({status:"submitted",completion,message:"Your profile is in the moderation queue. Existing public content, if any, remains unchanged until approval."});
      }
      if (path === "/api/candidate/profile/hide" && method === "POST") {
        Object.assign(profile,{visibility:"private",status:"draft",pending_review:false,public_snapshot:null,published_at:null,search_discovery:false,updated_at:now()}); audit(db,"candidate","profile.hidden","candidate_profile",profile.id); saveDb(db);
        return response({status:"private",message:"The public profile was hidden immediately. Your private Mobility Passport remains available to you."});
      }
      if (path === "/api/candidate/profile/rotate-key" && method === "POST") {
        profile.access_token=token(); profile.updated_at=now(); audit(db,"candidate","profile.key_rotated","candidate_profile",profile.id); saveDb(db);
        return response({profile_portal_url:`${baseFileUrl("passport.html")}#access=${encodeURIComponent(profile.access_token)}`,message:"Access key rotated. The previous link no longer works."});
      }
      if (path === "/api/candidate/matches" && method === "GET") {
        const items=db.matches.filter(m=>m.candidate_id===candidate.id).map(m=>{
          const job=db.jobs.find(j=>j.id===m.job_id); if(!job||job.status!=="published")return null;
          const employer=db.employers.find(e=>e.id===job.employer_id);
          return Object.assign({},copy(m),copy(job),{id:m.id,job_id:job.id,org_name:employer?employer.org_name:(job.submitted_org_name||"Verified employer")});
        }).filter(Boolean).sort((a,b)=>b.score-a.score);
        return response({items,count:items.length,updated_at:db.updated_at});
      }
      const decisionMatch=path.match(/^\/api\/candidate\/matches\/([^/]+)\/decision$/);
      if (decisionMatch && method === "POST") {
        const match=db.matches.find(m=>m.id===decisionMatch[1]&&m.candidate_id===candidate.id); if(!match)return error("Match not found.",404);
        if(body.decision==="interested"){match.stage="candidate_consented";match.candidate_consent=true;}else{match.stage="declined";match.candidate_consent=false;} match.updated_at=now(); audit(db,"candidate","match.decision","match",match.id,{decision:body.decision}); saveDb(db);
        return response({id:match.id,stage:match.stage,message:match.candidate_consent?"Interest recorded. Staff will verify the pathway and seek employer consent before any introduction.":"The opportunity was removed from your active path."});
      }
    }

    if (path.startsWith("/api/admin/")) {
      if (!requireAdmin(init)) return error("Administrator token is invalid.",401);
      if (path === "/api/admin/overview" && method === "GET") {
        const m=metrics(db); return response({metrics:m,queues:{candidates_new:db.candidates.filter(x=>x.status==="new").length,profiles_review:db.profiles.filter(x=>x.pending_review).length,employers_applied:db.employers.filter(x=>x.status==="applied").length,jobs_submitted:db.jobs.filter(x=>["submitted","review"].includes(x.status)).length,cases_triage:db.cases.filter(x=>x.status==="triage").length,corrections_new:db.corrections.filter(x=>["new","investigating"].includes(x.status)).length,matches_suggested:db.matches.filter(x=>["suggested","candidate_review"].includes(x.stage)).length},updated_at:db.updated_at});
      }
      const queueMatch=path.match(/^\/api\/admin\/submissions\/([^/]+)$/);
      if(queueMatch&&method==="GET"){const items=adminQueue(db,queueMatch[1]);return response({items,count:items.length,updated_at:db.updated_at});}
      const exportMatch=path.match(/^\/api\/admin\/export\/([^/]+)\.csv$/);
      if(exportMatch&&method==="GET"){const csv=toCsv(adminQueue(db,exportMatch[1]));return response(csv,200,{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename=justice-grows-${exportMatch[1]}.csv`});}
      if(path==="/api/admin/registry"&&method==="POST"){
        const record={id:id("reg"),display_name:body.display_name||null,jurisdiction:body.jurisdiction||"State",state:body.state||null,agency_identifier:body.agency_identifier||null,custody_status:body.custody_status||"unknown",cannabis_classification:body.cannabis_classification||"cannabis_primary",confidence:body.confidence||"provisional",last_verified_at:body.last_verified_at||dateOnly(),projected_release_date:body.projected_release_date||null,release_date:body.release_date||null,violence_screen_statement:body.violence_screen_statement||"No violent offense was identified in the current commitment records reviewed as of the stated date.",profile_consent:bool(body.profile_consent),source_count:0,publication_status:"draft",created_at:now(),updated_at:now()};db.registry.push(record);audit(db,"admin","registry.created","registry",record.id);saveDb(db);return response({id:record.id,status:"draft"},201);}
      let match;
      if((match=path.match(/^\/api\/admin\/profiles\/([^/]+)\/moderate$/))&&method==="POST"){
        const profile=db.profiles.find(p=>p.id===match[1]);if(!profile)return error("Profile not found.",404);const candidate=db.candidates.find(c=>c.id===profile.candidate_id);
        profile.moderation_notes=body.note||null;profile.pending_review=false;profile.updated_at=now();
        if(body.status==="published"){profile.status="published";profile.published_at=now();profile.public_snapshot=profile.visibility==="public"?publicSnapshot(profile,candidate):null;}
        else if(body.status==="changes_requested"){profile.status="changes_requested";profile.public_snapshot=null;profile.published_at=null;}
        else{profile.status="paused";profile.public_snapshot=null;profile.published_at=null;}
        audit(db,"admin","profile.moderated","candidate_profile",profile.id,{status:profile.status});saveDb(db);return response({id:profile.id,status:profile.status});
      }
      if((match=path.match(/^\/api\/admin\/employers\/([^/]+)\/verify$/))&&method==="POST"){
        const employer=db.employers.find(e=>e.id===match[1]);if(!employer)return error("Employer not found.",404);employer.status=body.status;employer.verification_notes=body.note||null;employer.updated_at=now();audit(db,"admin","employer.status","employer",employer.id,{status:employer.status});saveDb(db);return response({id:employer.id,status:employer.status});
      }
      if((match=path.match(/^\/api\/admin\/jobs\/([^/]+)\/publish$/))&&method==="POST"){
        const job=db.jobs.find(j=>j.id===match[1]);if(!job)return error("Job not found.",404);
        if(!job.employer_id){const found=db.employers.find(e=>e.org_name.trim().toLowerCase()===String(job.submitted_org_name||"").trim().toLowerCase());if(found)job.employer_id=found.id;}
        const employer=db.employers.find(e=>e.id===job.employer_id);if(!employer||!["verified","proven"].includes(employer.status))return error("Employer must be verified before publishing this role.",409);
        job.status="published";job.published_at=now();job.expires_at=body.expires_at||null;if(body.licensing_notes)job.licensing_notes=body.licensing_notes;job.updated_at=now();const count=refreshMatches(db,null,job.id);audit(db,"admin","job.published","job",job.id,{matches_refreshed:count});saveDb(db);return response({id:job.id,status:"published",matches_refreshed:count});
      }
      if((match=path.match(/^\/api\/admin\/jobs\/([^/]+)\/status$/))&&method==="POST"){
        const job=db.jobs.find(j=>j.id===match[1]);if(!job)return error("Job not found.",404);job.status=body.status;job.updated_at=now();audit(db,"admin","job.status","job",job.id,{status:job.status});saveDb(db);return response({id:job.id,status:job.status});
      }
      if((match=path.match(/^\/api\/admin\/corrections\/([^/]+)\/status$/))&&method==="POST"){
        const item=db.corrections.find(x=>x.id===match[1]);if(!item)return error("Correction request not found.",404);item.status=body.status;item.resolution_note=body.note||null;item.updated_at=now();audit(db,"admin","correction.status","correction_request",item.id,{status:item.status});saveDb(db);return response({id:item.id,status:item.status});
      }
      if((match=path.match(/^\/api\/admin\/matches\/([^/]+)\/stage$/))&&method==="POST"){
        const item=db.matches.find(x=>x.id===match[1]);if(!item)return error("Match not found.",404);item.stage=body.status;item.updated_at=now();audit(db,"admin","match.stage","match",item.id,{stage:item.stage});saveDb(db);return response({id:item.id,stage:item.stage});
      }
      if((match=path.match(/^\/api\/admin\/registry\/([^/]+)\/sources$/))&&method==="POST"){
        const record=db.registry.find(r=>r.id===match[1]);if(!record)return error("Registry record not found.",404);const source=Object.assign({id:id("src"),registry_id:record.id,created_at:now()},copy(body));db.registry_sources.push(source);record.source_count=db.registry_sources.filter(s=>s.registry_id===record.id).length;record.updated_at=now();audit(db,"admin","registry.source_added","registry",record.id,{source_type:source.source_type});saveDb(db);return response({id:source.id,registry_id:record.id},201);}
      if((match=path.match(/^\/api\/admin\/registry\/([^/]+)\/reviews$/))&&method==="POST"){
        const record=db.registry.find(r=>r.id===match[1]);if(!record)return error("Registry record not found.",404);db.registry_reviews=db.registry_reviews.filter(r=>!(r.registry_id===record.id&&r.reviewer_id===body.reviewer_id));const review=Object.assign({id:id("rev"),registry_id:record.id,created_at:now()},copy(body));db.registry_reviews.push(review);record.updated_at=now();audit(db,"admin","registry.review_added","registry",record.id,{reviewer_id:body.reviewer_id,decision:body.decision});saveDb(db);return response({id:review.id,registry_id:record.id,decision:review.decision},201);}
      if((match=path.match(/^\/api\/admin\/registry\/([^/]+)\/publish$/))&&method==="POST"){
        const record=db.registry.find(r=>r.id===match[1]);if(!record)return error("Registry record not found.",404);if(!bool(body.acknowledgment))return error("Publication acknowledgment is required.",422);if(!["confirmed","supported"].includes(record.confidence))return error("Only confirmed or supported records may be published.",409);
        const sources=db.registry_sources.filter(s=>s.registry_id===record.id);if(sources.length<2)return error("At least two documented sources are required.",409);if(!sources.some(s=>["judgment","commitment_record","court_docket","records_extract"].includes(s.source_type)))return error("At least one court, commitment, or official records source is required.",409);
        const complete=r=>["identity_confirmed","current_custody_confirmed","cannabis_attribution_confirmed","all_current_counts_reviewed","violence_screen_complete","release_status_checked"].every(k=>bool(r[k]));const approvals=[...new Set(db.registry_reviews.filter(r=>r.registry_id===record.id&&r.decision==="approve"&&complete(r)).map(r=>r.reviewer_id))];if(approvals.length<2)return error("Two distinct reviewers must approve every verification check.",409);if(db.registry_reviews.some(r=>r.registry_id===record.id&&["hold","reject"].includes(r.decision)))return error("Resolve all hold or reject reviews before publication.",409);
        record.publication_status="published";record.source_count=sources.length;record.updated_at=now();audit(db,"admin","registry.published","registry",record.id,{source_count:sources.length,reviewer_count:approvals.length});saveDb(db);return response({id:record.id,status:"published",source_count:sources.length,approvals:approvals.length});
      }
      if((match=path.match(/^\/api\/admin\/registry\/([^/]+)\/status$/))&&method==="POST"){
        const record=db.registry.find(r=>r.id===match[1]);if(!record)return error("Registry record not found.",404);record.publication_status=body.status;record.updated_at=now();audit(db,"admin","registry.status","registry",record.id,{status:body.status});saveDb(db);return response({id:record.id,status:record.publication_status});
      }
    }

    return error(`Local test API route not implemented: ${method} ${path}`, 404);
  }

  window.fetch = function (input, init) {
    const raw = typeof input === "string" ? input : input.url;
    const fallbackBase = /^https?:/i.test(window.location.href) ? window.location.href : (cfg.siteUrl || "https://zsend.github.io/AzroTest/");
    let url;
    try { url = new URL(raw, fallbackBase); }
    catch (_) { return nativeFetch(input, init); }
    const apiPath = raw.startsWith("/api/") ? url.pathname : (url.pathname.startsWith("/api/") ? url.pathname : null);
    if (!apiPath) return nativeFetch(input, init);

    if (cfg.mode === "edge" || cfg.mode === "remote") {
      if (!cfg.apiBase) return response({ detail:"Production API mode is selected, but apiBase is empty." },503);
      const target = String(cfg.apiBase).replace(/\/$/, "") + apiPath + url.search;
      const headers = new Headers((init && init.headers) || {});
      headers.set("X-Justice-Grows-Site", window.location.origin);
      return nativeFetch(target, Object.assign({}, init || {}, { headers }));
    }
    return localRoute(apiPath, url.searchParams, init || {});
  };

  function injectModeBanner() {
    if (cfg.mode !== "local" || cfg.showLocalModeWarning === false) return;
    const style = document.createElement("style");
    style.textContent = ".jg-test-banner{position:relative;z-index:1000;background:#0d1d17;color:#fff;border-bottom:1px solid rgba(255,255,255,.16);font:700 11px/1.4 Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}.jg-test-banner__inner{width:min(calc(100% - 24px),1180px);min-height:36px;margin:auto;display:flex;align-items:center;justify-content:center;gap:8px;text-align:center}.jg-test-banner b{color:#c7f56a}.jg-test-banner a{color:#fff;text-decoration:underline;text-underline-offset:3px}.jg-test-banner code{background:rgba(255,255,255,.1);border-radius:5px;padding:2px 5px}.jg-test-pill{display:inline-block;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:2px 7px;font-size:9px;letter-spacing:.06em;text-transform:uppercase}@media(max-width:700px){.jg-test-banner__inner{min-height:44px;padding:6px 0}.jg-test-pill{display:none}}";
    document.head.appendChild(style);
    const banner = document.createElement("div");
    banner.className = "jg-test-banner";
    banner.innerHTML = `<div class="jg-test-banner__inner"><span class="jg-test-pill">Preview</span><span><b>Preview:</b> fictional data only · <a href="${baseFileUrl("ops.html")}">Ops</a> <code>${ADMIN_TOKEN}</code></span></div>`;
    document.body.insertBefore(banner, document.body.firstChild);
  }

  window.JusticeGrowsTest = Object.freeze({
    mode: cfg.mode || "local",
    exportData() { return copy(loadDb()); },
    reset() { storage.removeItem(KEY); window.location.reload(); },
    adminToken: cfg.mode === "local" ? ADMIN_TOKEN : null,
    storageKey: KEY
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectModeBanner, { once:true }); else injectModeBanner();
})();
