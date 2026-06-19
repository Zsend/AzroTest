import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8878/justice-grows-proof-final/"
ROOT = Path("/mnt/data/justice-grows-proof-final")
PREVIEWS = ROOT / "previews"
PREVIEWS.mkdir(parents=True, exist_ok=True)
ADMIN = "pilot-admin"

steps = []
errors = []
page_errors = []
overflow = []


def record(name, ok, detail=None):
    item = {"name": name, "ok": bool(ok)}
    if detail is not None:
        item["detail"] = detail
    steps.append(item)
    print(("PASS" if ok else "FAIL") + " | " + name + (" | " + str(detail)[:180] if detail is not None else ""), flush=True)
    if not ok:
        errors.append({"name": name, "detail": detail})


async def api(page, path, method="GET", body=None, token=None):
    return await page.evaluate(
        """async ({path, method, body, token}) => {
          const headers = {'Content-Type':'application/json'};
          if (token) headers.Authorization = 'Bearer ' + token;
          const r = await fetch(path, {
            method,
            headers,
            body: body === null || body === undefined ? undefined : JSON.stringify(body)
          });
          let data = null;
          try { data = await r.json(); } catch (_) { try { data = await r.text(); } catch (_) {} }
          return {status:r.status, ok:r.ok, body:data};
        }""",
        {"path": path, "method": method, "body": body, "token": token},
    )


async def check_overflow(page, name):
    dims = await page.evaluate("""() => ({
      bodyScroll: document.body.scrollWidth,
      bodyClient: document.body.clientWidth,
      docScroll: document.documentElement.scrollWidth,
      docClient: document.documentElement.clientWidth,
      viewport: window.innerWidth
    })""")
    delta = max(dims["bodyScroll"] - dims["viewport"], dims["docScroll"] - dims["viewport"])
    ok = delta <= 1
    overflow.append({"page": name, "ok": ok, "delta_px": delta, **dims})
    record(f"{name} has no page-level horizontal overflow", ok, dims)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            executable_path="/usr/bin/chromium",
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        context = await browser.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
        page = await context.new_page()
        page.set_default_timeout(7000)

        page.on("pageerror", lambda exc: page_errors.append({"type":"pageerror","message":str(exc)}))
        page.on("console", lambda msg: page_errors.append({"type":"console","message":msg.text}) if msg.type == "error" else None)

        # Fresh zero-state acceptance.
        await page.goto(BASE, wait_until="domcontentloaded")
        await page.evaluate("localStorage.clear()")
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(500)
        metrics = await api(page, "/api/public/metrics")
        record("fresh browser database starts empty", metrics["ok"] and all(v in (0, None) for v in metrics["body"]["actual"].values()), metrics)
        zero_copy = await page.locator("#jobList").inner_text()
        record("zero jobs is rendered as an explicit verified baseline", "No role has met the proof standard yet" in zero_copy, zero_copy)
        record("homepage states zero is the starting truth", await page.get_by_text("Zero is the starting truth.", exact=True).count() == 1)
        record("homepage identifies the product as a proof layer", await page.get_by_text("The proof layer for cannabis justice", exact=False).count() >= 1)
        await check_overflow(page, "home desktop")
        await page.screenshot(path=str(PREVIEWS / "home-desktop-zero.png"), full_page=False)

        await page.goto(BASE + "proof.html", wait_until="domcontentloaded")
        await page.wait_for_timeout(400)
        record("public ledger reports no earned employer credit", await page.get_by_text("No employer has earned public credit yet.", exact=True).count() == 1)
        record("public ledger reports no published claim finding", await page.get_by_text("No reviewed claim finding has been published.", exact=True).count() == 1)
        await check_overflow(page, "proof ledger desktop zero")
        await page.screenshot(path=str(PREVIEWS / "proof-desktop-zero.png"), full_page=False)

        # Candidate UI intake.
        await page.goto(BASE + "?open=candidate", wait_until="domcontentloaded")
        await page.wait_for_timeout(200)
        candidate_modal = page.locator("#candidateModal")
        record("candidate intake opens from a direct campaign link", await candidate_modal.evaluate("el => el.classList.contains('open')"))
        await candidate_modal.locator('[name="first_name"]').fill("Ava")
        await candidate_modal.locator('[name="last_name"]').fill("Rivera")
        await candidate_modal.locator('[name="email"]').fill("ava@example.test")
        await candidate_modal.locator('[name="state"]').select_option("ID")
        await candidate_modal.locator('[name="city"]').fill("Boise")
        await candidate_modal.locator('[name="release_status"]').select_option("released")
        await candidate_modal.locator('[name="role_interests"]').fill("operations, logistics")
        await candidate_modal.locator('[name="skills"]').fill("inventory, Excel, forklift, team leadership")
        await candidate_modal.locator('[name="min_hourly_wage"]').fill("24")
        for name in ["remote_ok", "relocation_ok", "consent_matching", "consent_contact", "privacy_acknowledgment"]:
            await candidate_modal.locator(f'[name="{name}"]').check()
        await candidate_modal.locator('button[type="submit"]').click()
        await candidate_modal.locator(".form-status.success").wait_for(state="visible", timeout=5000)
        passport_href = await candidate_modal.locator(".form-status a").get_attribute("href")
        record("candidate UI creates a private Mobility Passport", bool(passport_href and "passport.html#access=" in passport_href), passport_href)
        candidate_access = passport_href.split("#access=", 1)[1]

        # Candidate profile is rich, candidate-owned, and public only by separate consent.
        profile_payload = {
            "display_name":"Ava R.",
            "identity_mode":"first_initial",
            "headline":"Operations leader building reliable logistics systems",
            "about":"I turn complex workflows into dependable daily operations. I value safety, clear standards, direct communication, and measurable improvement.",
            "work_history":"Led warehouse receiving and cycle counts; trained new team members; maintained accurate inventory; coordinated forklift and loading workflows; improved handoff documentation.",
            "goals_12_month":"Secure a full-time operations role above $24 per hour, complete a recognized logistics credential, and move into a team-lead position.",
            "ambition_3_year":"Manage a multi-site logistics operation, mentor returning citizens, and earn an ownership stake in a growing business.",
            "visibility":"public",
            "strengths":["reliable","calm under pressure","systems thinker","coach"],
            "skills":"inventory, Excel, forklift, team leadership, logistics",
            "role_interests":"operations, logistics",
            "certifications":["Forklift operator","OSHA 10"],
            "training_interests":["METRC","project management"],
            "portfolio_links":["https://example.com/fictional-portfolio"],
            "preferred_locations":["Boise","Remote","Open to relocation"],
            "schedule_preferences":["Full time","Weekdays"],
            "languages":["English","Spanish"],
            "story_consent":False,
            "search_discovery":False,
            "public_profile_consent":True,
        }
        profile_save = await api(page, "/api/candidate/profile", "PUT", profile_payload, candidate_access)
        record("candidate can publish skills and ambitions without granting story rights", profile_save["status"] == 200 and profile_save["body"].get("completion", 0) >= 90, profile_save)
        profile_submit = await api(page, "/api/candidate/profile/submit", "POST", {"acknowledgment":True}, candidate_access)
        record("candidate submits Passport for moderation", profile_submit["status"] == 200, profile_submit)
        profiles = await api(page, "/api/admin/submissions/profiles", token=ADMIN)
        profile_id = profiles["body"]["items"][0]["id"]
        profile_moderate = await api(page, f"/api/admin/profiles/{profile_id}/moderate", "POST", {"status":"published","note":"Fictional acceptance-test profile approved."}, ADMIN)
        record("staff moderation gates public talent publication", profile_moderate["status"] == 200, profile_moderate)
        talent = await api(page, "/api/public/talent")
        public_profile = talent["body"]["items"][0]
        no_sensitive = all(k not in public_profile for k in ["email","phone","release_status","conviction","custody_status"])
        record("public talent snapshot excludes contact, conviction, and custody fields", talent["body"]["count"] == 1 and no_sensitive, public_profile)

        # Employer compact protections.
        bad_employer = {
            "org_name":"Fictional Green Logistics Co.","state":"ID","org_type":"ancillary","employee_count":"10_49","roles_per_quarter":2,
            "states_hiring":"ID","pathways":"ancillary, remote","first_name":"Morgan","last_name":"Lee","title":"COO","email":"morgan@example.test",
            "wage_transparency":True,"no_blanket_ban":True,"fair_chance_process":True,"outcome_reporting":True,"candidate_privacy":True,"advancement_commitment":True,
            "story_rights":False,"public_name_consent":True
        }
        reject_story = await api(page, "/api/intake/employer", "POST", bad_employer)
        record("employer cannot join without separate candidate story-rights commitment", reject_story["status"] == 422, reject_story)
        employer_body = dict(bad_employer); employer_body["story_rights"] = True
        employer = await api(page, "/api/intake/employer", "POST", employer_body)
        employer_id = employer["body"]["id"]
        record("employer application enters private verification queue", employer["status"] == 201, employer)

        # A job cannot publish before the employer is verified.
        job_payload = {
            "employer_id":employer_id,"org_name":"Fictional Green Logistics Co.","contact_name":"Morgan Lee","email":"morgan@example.test",
            "title":"Warehouse Operations Lead","city":"Boise","state":"ID","remote":False,"relocation_support":True,"pathway":"ancillary","employment_type":"full_time",
            "wage_min":28,"wage_max":34,"salary_period":"hour","benefits":"health, dental, PTO","skills":"inventory, Excel, forklift, team leadership",
            "role_interests":"operations, logistics","description":"Lead receiving, inventory control, daily warehouse coordination, safety routines, team training, and measurable process improvement across a growing ancillary business.",
            "background_process":"Conviction history is considered only after a conditional offer through individualized, role-specific legal review.",
            "licensing_notes":"Ancillary, non-plant-touching role. Confirm current state and local requirements before hire.","compact_acknowledgment":True
        }
        job = await api(page, "/api/intake/job", "POST", job_payload)
        job_id = job["body"]["id"]
        record("paid role enters verification queue", job["status"] == 201, job)
        premature_job = await api(page, f"/api/admin/jobs/{job_id}/publish", "POST", {}, ADMIN)
        record("job publication is blocked until employer verification", premature_job["status"] == 409, premature_job)
        verified = await api(page, f"/api/admin/employers/{employer_id}/verify", "POST", {"status":"verified","note":"Fictional acceptance-test policy review complete."}, ADMIN)
        record("employer can earn policy-verified status through review", verified["status"] == 200, verified)
        published_job = await api(page, f"/api/admin/jobs/{job_id}/publish", "POST", {"licensing_notes":"Fictional acceptance-test role; ancillary pathway reviewed."}, ADMIN)
        record("verified employer role can be published", published_job["status"] == 200, published_job)
        jobs = await api(page, "/api/public/jobs")
        record("public job board shows only the verified role", jobs["body"]["count"] == 1 and jobs["body"]["items"][0]["title"] == "Warehouse Operations Lead", jobs)

        # Skills-first matching and candidate-controlled introduction.
        matches = await api(page, "/api/candidate/matches", token=candidate_access)
        match = matches["body"]["items"][0]
        match_id = match["id"]
        record("skills-first matching produces a high-confidence candidate opportunity", matches["body"]["count"] == 1 and match["score"] >= 80, match)
        decision = await api(page, f"/api/candidate/matches/{match_id}/decision", "POST", {"decision":"interested"}, candidate_access)
        record("candidate controls every employer introduction", decision["status"] == 200 and decision["body"]["stage"] == "candidate_consented", decision)

        # Outcome proof must start with candidate confirmation and progress in order.
        premature_mobility = await api(page, f"/api/admin/matches/{match_id}/outcomes", "POST", {"event_type":"promotion","confirmed_by_candidate":True,"confirmed_by_employer":True,"note":"Should be blocked."}, ADMIN)
        record("mobility cannot be recorded before a confirmed career start", premature_mobility["status"] == 409, premature_mobility)
        unconfirmed_start = await api(page, f"/api/admin/matches/{match_id}/outcomes", "POST", {"event_type":"started","confirmed_by_candidate":False,"confirmed_by_employer":True,"wage":29,"salary_period":"hour"}, ADMIN)
        record("public career starts require candidate confirmation", unconfirmed_start["status"] == 422, unconfirmed_start)
        start = await api(page, f"/api/admin/matches/{match_id}/outcomes", "POST", {"event_type":"started","confirmed_by_candidate":True,"confirmed_by_employer":True,"wage":29,"salary_period":"hour","note":"Candidate-confirmed fictional start."}, ADMIN)
        retained = await api(page, f"/api/admin/matches/{match_id}/outcomes", "POST", {"event_type":"retained_180","confirmed_by_candidate":True,"confirmed_by_employer":True,"note":"Candidate-confirmed fictional 180-day retention."}, ADMIN)
        promotion = await api(page, f"/api/admin/matches/{match_id}/outcomes", "POST", {"event_type":"promotion","confirmed_by_candidate":True,"confirmed_by_employer":True,"note":"Candidate-confirmed fictional promotion."}, ADMIN)
        record("candidate-confirmed start, retention, and mobility form the outcome proof chain", all(r["status"] == 201 for r in [start, retained, promotion]), {"start":start,"retained":retained,"promotion":promotion})
        employers_public = await api(page, "/api/public/employers")
        employer_public = employers_public["body"]["items"][0]
        record("employer earns the highest proof level only after verified mobility", employer_public["proof_level"] == "mobility_verified" and employer_public["career_starts"] == 1 and employer_public["retained_180"] == 1 and employer_public["advancement_events"] == 1, employer_public)

        # Industry claim UI + evidence/right-of-reply publication gates.
        await page.goto(BASE + "?open=claim", wait_until="domcontentloaded")
        await page.wait_for_timeout(200)
        claim_modal = page.locator("#claimModal")
        await claim_modal.locator('[name="company_name"]').fill("Fictional Cannabis Brand")
        await claim_modal.locator('[name="claim_url"]').fill("https://example.com/fair-chance-claim")
        await claim_modal.locator('[name="claim_type"]').select_option("hiring")
        await claim_modal.locator('[name="claim_summary"]').fill("The public statement says the company supports fair-chance cannabis hiring and reentry opportunity.")
        await claim_modal.locator('[name="good_faith"]').check()
        await claim_modal.locator('button[type="submit"]').click()
        await claim_modal.locator(".form-status.success").wait_for(state="visible", timeout=5000)
        record("public claim submission creates a private research lead, not an accusation", "private research lead" in (await claim_modal.locator(".form-status.success").inner_text()).lower())
        claims_queue = await api(page, "/api/admin/submissions/claims", token=ADMIN)
        claim_id = claims_queue["body"]["items"][0]["id"]
        bad_claim_note = await api(page, f"/api/admin/claims/{claim_id}/status", "POST", {"status":"closed_no_evidence","note":"Too short","right_of_reply_status":"not_started","public":True}, ADMIN)
        record("claim finding cannot publish without a specific evidence note", bad_claim_note["status"] == 422, bad_claim_note)
        bad_claim_reply = await api(page, f"/api/admin/claims/{claim_id}/status", "POST", {"status":"closed_no_evidence","note":"The reviewed public source did not identify a currently open role or candidate-confirmed employment outcome that met the published proof standard.","right_of_reply_status":"not_started","public":True}, ADMIN)
        record("claim finding cannot publish before right of reply", bad_claim_reply["status"] == 409, bad_claim_reply)
        good_claim = await api(page, f"/api/admin/claims/{claim_id}/status", "POST", {"status":"closed_no_evidence","note":"The reviewed public source did not identify a currently open role or candidate-confirmed employment outcome that met the published proof standard.","right_of_reply_status":"expired","public":True}, ADMIN)
        record("completed evidence and reply workflow can publish a neutral finding", good_claim["status"] == 200, good_claim)
        public_claims = await api(page, "/api/public/claims")
        record("public claim ledger exposes only the completed neutral finding", public_claims["body"]["count"] == 1 and public_claims["body"]["items"][0]["finding_status"] == "closed_no_evidence", public_claims)

        # Registry publication gate.
        registry = await api(page, "/api/admin/registry", "POST", {
            "display_name":"Test Person","jurisdiction":"Fictional State Corrections","state":"ID","agency_identifier":"TEST-001",
            "custody_status":"release_pending","cannabis_classification":"cannabis_only","confidence":"supported","last_verified_at":"2026-06-19",
            "projected_release_date":"2026-12-01","violence_screen_statement":"No violent offense was identified in the current commitment records reviewed as of June 19, 2026.","profile_consent":False
        }, ADMIN)
        registry_id = registry["body"]["id"]
        premature_registry = await api(page, f"/api/admin/registry/{registry_id}/publish", "POST", {"acknowledgment":True}, ADMIN)
        record("registry publication is blocked before source and reviewer gates", premature_registry["status"] == 409, premature_registry)
        src1 = await api(page, f"/api/admin/registry/{registry_id}/sources", "POST", {"source_type":"court_docket","source_url":"https://example.com/court-record","source_date":"2026-06-15","note":"Fictional acceptance-test source."}, ADMIN)
        src2 = await api(page, f"/api/admin/registry/{registry_id}/sources", "POST", {"source_type":"records_extract","source_url":"https://example.com/corrections-record","source_date":"2026-06-18","note":"Fictional acceptance-test source."}, ADMIN)
        review_body = {"decision":"approve","identity_confirmed":True,"current_custody_confirmed":True,"cannabis_attribution_confirmed":True,"all_current_counts_reviewed":True,"violence_screen_complete":True,"release_status_checked":True,"note":"All fictional acceptance-test checks complete."}
        rev1 = await api(page, f"/api/admin/registry/{registry_id}/reviews", "POST", {**review_body,"reviewer_id":"reviewer-alpha"}, ADMIN)
        rev2 = await api(page, f"/api/admin/registry/{registry_id}/reviews", "POST", {**review_body,"reviewer_id":"reviewer-beta"}, ADMIN)
        registry_publish = await api(page, f"/api/admin/registry/{registry_id}/publish", "POST", {"acknowledgment":True}, ADMIN)
        record("registry requires two sources and two independent complete reviews", all(r["status"] in (200,201) for r in [src1,src2,rev1,rev2,registry_publish]) and registry_publish["body"]["approvals"] == 2, registry_publish)

        # Public actuals, populated proof ledger, and design screenshots.
        final_metrics = await api(page, "/api/public/metrics")
        actual = final_metrics["body"]["actual"]
        expected = {"verified_employers":1,"open_jobs":1,"career_starts":1,"retained_180":1,"advancement_events":1,"verified_registry_records":1,"public_profiles":1}
        record("public metrics separate and correctly count verified actual outcomes", all(actual.get(k) == v for k,v in expected.items()), {"expected":expected,"actual":actual})

        await page.goto(BASE + "proof.html", wait_until="domcontentloaded")
        await page.wait_for_timeout(500)
        record("populated proof ledger shows earned employer credit", await page.get_by_text("Fictional Green Logistics Co.", exact=True).count() == 1)
        record("populated proof ledger shows neutral claim finding", await page.get_by_text("Fictional Cannabis Brand", exact=True).count() == 1)
        record("proof ledger shows mobility-verified level", await page.get_by_text("Mobility Verified", exact=True).count() == 1)
        await check_overflow(page, "proof ledger desktop populated")
        await page.screenshot(path=str(PREVIEWS / "proof-desktop-populated.png"), full_page=False)

        await page.goto(BASE, wait_until="domcontentloaded")
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(PREVIEWS / "home-desktop-populated.png"), full_page=False)

        # Candidate portal story-rights and privacy controls.
        await page.goto(passport_href, wait_until="domcontentloaded")
        await page.wait_for_timeout(500)
        record("private Passport opens with its secure candidate key", await page.locator("#appShell").evaluate("el => !el.classList.contains('hidden')"))
        record("Passport states that a job application never grants marketing rights", await page.get_by_text("A job application never grants marketing rights", exact=False).count() >= 1)
        await check_overflow(page, "Passport desktop")
        await page.screenshot(path=str(PREVIEWS / "passport-desktop-final.png"), full_page=False)

        # Operations console UI and claims queue.
        await page.goto(BASE + "ops.html", wait_until="domcontentloaded")
        await page.locator("#tokenInput").fill(ADMIN)
        await page.locator("#loginBtn").click()
        await page.locator("#appView").wait_for(state="visible", timeout=5000)
        record("proof operations console authenticates in browser test mode", await page.locator("#healthText").inner_text() != "Not authenticated")
        await page.locator('button[data-queue="claims"]').first.click()
        await page.wait_for_timeout(250)
        record("operations console exposes the industry claim proof queue", "Fictional Cannabis Brand" in (await page.locator("#table").inner_text()))
        await check_overflow(page, "operations desktop")
        await page.screenshot(path=str(PREVIEWS / "ops-desktop-final.png"), full_page=False)

        # Mobile acceptance on all core experiences.
        await page.set_viewport_size({"width":390,"height":844})
        mobile_urls = [
            (BASE, "home mobile", PREVIEWS / "home-mobile-final.png"),
            (BASE + "proof.html", "proof ledger mobile", PREVIEWS / "proof-mobile-final.png"),
            (passport_href, "Passport mobile", PREVIEWS / "passport-mobile-final.png"),
            (BASE + "ops.html", "operations mobile", PREVIEWS / "ops-mobile-final.png"),
        ]
        for url, name, shot in mobile_urls:
            await page.goto(url, wait_until="domcontentloaded")
            await page.wait_for_timeout(350)
            if name == "operations mobile":
                if await page.locator("#authCard").is_visible():
                    await page.locator("#tokenInput").fill(ADMIN)
                    await page.locator("#loginBtn").click()
                await page.locator("#appView").wait_for(state="visible", timeout=5000)
            await check_overflow(page, name)
            await page.screenshot(path=str(shot), full_page=False)

        # No runtime errors; ignore benign favicon retrieval logs only if any.
        substantive_errors = [e for e in page_errors if "favicon" not in e.get("message", "").lower()]
        record("browser workflow completes without JavaScript page errors", len(substantive_errors) == 0, substantive_errors)

        report = {
            "release":"2026.06.19-proof-layer.6",
            "tested_at":datetime.now(timezone.utc).isoformat(),
            "base_url":BASE,
            "test_data":"fictional browser-local acceptance data; not included in a fresh deployment",
            "steps":steps,
            "summary":{
                "checks":len(steps),
                "passed":sum(1 for s in steps if s["ok"]),
                "failed":sum(1 for s in steps if not s["ok"]),
                "final_actual_metrics":actual,
                "employer_proof_level":employer_public.get("proof_level"),
                "public_claim_findings":public_claims["body"].get("count"),
                "top_match_score":match.get("score"),
            },
            "overflow":overflow,
            "page_errors":substantive_errors,
            "errors":errors,
        }
        (ROOT / "ACCEPTANCE_TEST_REPORT.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        await browser.close()

        print(json.dumps(report["summary"], indent=2))
        if errors or substantive_errors:
            raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
