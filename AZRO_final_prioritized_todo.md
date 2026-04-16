# AZRO final prioritized to-do list

## Tonight — finish the launch layer cleanly

### 1) Footer responsiveness lock
**Goal:** keep the footer top row consistent at every breakpoint without reopening the rest of the design system.

**Check at minimum:**
- 320
- 360
- 375
- 390
- 414
- 768
- 820
- 1024
- 1280
- 1440

**What needs to stay true:**
- both top footer cards stay equal and full-width
- centering stays clean
- container width stays consistent
- text sizes stay on-brand
- safe-area / bottom padding stays clean
- nothing else in the site shifts

**Status:** targeted footer launch-lock patch added.

---

### 2) Remove weak proof-card language
**Goal:** remove “91% hit rate” language and keep the proof strong without sounding like gambling.

**Approved proof framing to use going forward:**

#### BTC
- proof on chart
- matched auto-buy benchmark
- BTC-eq
- × vs auto
- extra sats
- accretion
- maintained weekly guidance
- the model has to earn its place

#### XRP
- confirmed major bottoms, tops, and risk windows
- published forward outcomes
- 100% top-side directional follow-through in the published cut
- Weekly Plan
- exact-message alerts
- deep test report
- live tracker
- proof on chart

**Status:** home proof card updated to remove hit-rate phrasing.

---

### 3) Sharpen the most visible product copy without causing layout drift
**Goal:** make the product pages and pricing sections sell harder while keeping copy lengths and layout risk controlled.

**Tonight’s scope:**
- home “start with one” card area
- products page hero / chooser / detail copy
- pricing page hero + core value bullets

**Copy principles for this pass:**
- shorter or equal length when possible
- more payoff, less jargon
- no gambling tone
- keep BTC as the foundation / destination
- keep XRP as the cycle amplifier and a serious standalone product

**Status:** surgical copy pass completed on home, products, and pricing.

---

### 4) Republish and verify live
**Goal:** ship the clean build and stop touching design unless a real issue remains.

**Live QA after publish:**
- hard refresh live site
- check home, products, pricing, proof, support
- check footer at desktop + mobile breakpoints
- check sticky CTA still sits cleanly
- confirm no spacing regressions

---

## Next 72 hours — trust, preview, and customer readiness

### 5) Replace the free-trial exploit path
- remove the public forever-free code
- replace with a controlled preview request flow
- collect TradingView username at intake
- set TradingView expiration immediately when access is granted
- keep preview narrow and time-boxed
- do not give preview users anything beyond the public diligence layer already on the site

### 6) Set up the minimum customer ops stack
Keep only:
- `support@azrosystems.com`

Add labels / buckets:
- Sales
- Trial
- Customer
- Refund
- Email list

Create a simple tracker with:
- name
- email
- TradingView username
- product
- purchase date
- access granted
- preview start / end
- converted Y/N
- notes

### 7) Gumroad cleanup
- add TradingView username as a required custom field
- add a terms / acknowledgment checkbox
- confirm sale notifications are on
- turn on PDF stamping for any customer-only PDFs delivered through Gumroad
- keep public docs separate from customer-only files

### 8) Customer email flow
For now:
- Gumroad sends the receipt
- AZRO sends one short onboarding email from `support@azrosystems.com`
- Trustpilot ask comes later, separately, after real usage
- keep it manual until the flow is proven

### 9) Trustpilot setup
- claim the profile
- add logo, correct domain, description, support contact
- use only neutral invites for real customers
- do not tie reviews to discounts, bonuses, or access

---

## Next 1–2 weeks — proof language and conversion improvements

### 10) Do the focused proof-copy study and rewrite
Study the docs again and lock a stronger site-wide proof language system.

**BTC themes to keep pulling from:**
- reserve-core engine
- matched auto-buy control
- proof that keeps score
- extra sats / accretion
- persistent dashboard
- weekly action

**XRP themes to keep pulling from:**
- close-confirmed cycle engine
- Weekly Plan
- exact-message alerts
- top-side defense
- Safety mode
- Cash flow bills
- continuity / live tracker

**Outputs needed:**
- new home proof-card copy
- better product-section copy
- stronger pricing-page value bullets
- one proof-language style guide for future copy

### 11) Update Gumroad product pages
- match the current site language
- make BTC feel like the clearest first move
- make XRP feel like a serious standalone cycle system and a powerful add-on
- remove weaker or stale phrasing

### 12) Add analytics and sale notifications
- checkout click tracking
- purchase tracking
- internal sale notifications
- source visibility

---

## Next 30 days — proof-led growth

### 13) Start the proof-led content engine
- one public proof post each week
- one weekly email memo
- one monthly case study / postmortem
- one quarterly model / benchmark review

### 14) Standardize the trust stack everywhere
Keep this trust stack consistent across:
- site
- Gumroad
- docs
- onboarding email
- support replies

**Trust stack:**
- maintained models
- proof on chart
- handbooks
- quick-start guides
- playbooks
- documented updates
- change control

### 15) Lock naming everywhere
Standardize naming across:
- site
- Gumroad
- docs
- TradingView
- emails
- support replies

---

## 30–90 days — build the moat above the script

### 16) Proof moat
- public proof ledger
- weekly archived outputs
- version log
- change-impact notes
- proof page that is hard to fake retroactively

### 17) Workflow moat
- weekly plan habit loop
- signal / benchmark archive
- saved playbooks or policies
- decision journal
- postmortem archive

### 18) Delivery moat
- AZRO-side alerts beyond TradingView
- email
- Telegram
- web push
- webhooks

### 19) Pricing moat
- move new revenue toward recurring plans over time
- keep legacy promises intact
- create higher-end licenses only after proof + workflow are real

---

## Rules to keep from here
- Do not reopen design work unless something is clearly broken.
- Do not use gambling language.
- Do not lead with “signals.” Use alerts, labels, confirmations, workflow, system, or model.
- Keep Bitcoin as the foundation and destination.
- Keep XRP as the cycle amplifier and opportunity engine.
- Keep the site world-class, plain-English, premium, and easy to trust.
- Build the moat above the script: **proof first, workflow second, pricing third, scale fourth.**
