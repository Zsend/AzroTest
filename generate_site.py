from pathlib import Path
base = Path('/mnt/data/final_build')

BTC_GUM = 'https://azrosystems.gumroad.com/l/btc-os-lifetime'
XRP_GUM = 'https://azrosystems.gumroad.com/l/kuvbu'
GUMROAD_HOME = 'https://azrosystems.gumroad.com'
BTC_TV = 'https://www.tradingview.com/script/RpcRHKsH-AZRO-Systems-BTC-Operating-System/'
XRP_TV = 'https://www.tradingview.com/script/4M3OWBpz-AZRO-Systems-XRP-Top-Bottom-Indicator-Invite-Only/'
INSTAGRAM = 'https://www.instagram.com/azrosystems/'
X_LINK = 'https://x.com/AzroSystems'
SUPPORT = 'support@azrosystems.com'
TRIAL_CODE = 'AZRO-FREE-TRIAL'

head_common = '''<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#070B16"/>
<link rel="icon" type="image/png" href="favicon-32.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="style.css"/>
<script defer src="script.js"></script>'''

def header(active):
    nav = []
    for href,label in [('index.html','Home'),('about.html','About'),('features.html','Features'),('pricing.html','Pricing'),('resources.html','Resources')]:
        cur = ' aria-current="page"' if active==href else ''
        nav.append(f'<a href="{href}"{cur}>{label}</a>')
    return f'''<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="index.html" aria-label="AZRO Systems home">
      <span class="brand-mark" aria-hidden="true"><img src="logo-mark.png" width="44" height="44" alt="" loading="eager" decoding="async"/></span>
      <span class="brand-name">AZRO Systems</span>
    </a>
    <button class="nav-toggle" type="button" aria-label="Open menu" aria-controls="site-nav" aria-expanded="false">
      <svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" viewBox="0 0 24 24"><path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h16"></path></svg>
    </button>
    <nav class="nav" id="site-nav" aria-label="Primary navigation">{''.join(nav)}</nav>
    <div class="header-actions">
      <button class="btn btn--sm btn--ghost" data-trial-open type="button">Free trial</button>
      <a class="btn btn--sm btn--primary" data-glow="1" href="pricing.html">Buy access</a>
    </div>
  </div>
</header>'''

def footer():
    return f'''<footer class="site-footer">
  <div class="container">
    <div class="footer-inner">
      <div class="footer-brand">
        <strong>AZRO Systems</strong>
        <div class="small">Proof-first TradingView indicators and operating systems.<br/>Built for clarity, durability, and conservative execution.</div>
        <div class="footer-meta">© 2026 Azro Labs LLC. Educational only • not investment advice.</div>
      </div>
      <div class="footer-links" aria-label="Footer links">
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
        <a href="features.html">Features</a>
        <a href="pricing.html">Pricing</a>
        <a href="resources.html">Resources</a>
        <a href="pdfs/risk-disclosure.pdf" target="_blank" rel="noopener">Risk disclosure</a>
        <a href="{GUMROAD_HOME}" target="_blank" rel="noopener">Gumroad</a>
        <a href="{X_LINK}" target="_blank" rel="noopener">X</a>
        <a href="{INSTAGRAM}" target="_blank" rel="noopener">Instagram</a>
      </div>
    </div>
  </div>
</footer>'''

def trial_modal():
    return f'''<div class="modal modal--solid" id="trialModal" aria-hidden="true">
  <div class="modal__backdrop" data-modal-close></div>
  <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="trialTitle">
    <button class="modal__close" type="button" data-modal-close aria-label="Close">✕</button>
    <h2 id="trialTitle">Free trial (all features included)</h2>
    <p>Try the full AZRO workflow on TradingView before you buy. It works with a free TradingView account and no card is required.</p>
    <div class="code-box"><code id="trialCode">{TRIAL_CODE}</code><button class="btn btn--sm btn--ghost" type="button" data-copy-code>Copy</button></div>
    <p class="small" style="margin-top:10px;">Use the code on Gumroad at checkout, add your TradingView username, and we’ll send invite-only access. The code stays active.</p>
    <div class="modal__actions">
      <a class="btn btn--sm btn--primary" data-glow="1" href="{GUMROAD_HOME}" target="_blank" rel="noopener">Open Gumroad</a>
      <a class="btn btn--sm btn--ghost" href="mailto:{SUPPORT}?subject=AZRO%20free%20trial%20request">Email support</a>
    </div>
  </div>
</div>'''

def video_modal():
    return '''<div class="modal" id="labelModal" aria-hidden="true">
  <div class="modal__backdrop" data-modal-close></div>
  <div class="modal__dialog modal__dialog--video" role="dialog" aria-modal="true" aria-labelledby="labelModalTitle">
    <button class="modal__close" type="button" data-modal-close aria-label="Close">✕</button>
    <div class="modal__head">
      <h2 id="labelModalTitle" data-label-title>Walkthrough</h2>
      <p data-label-desc>See how the workflow behaves on chart.</p>
    </div>
    <div class="video-frame"><video playsinline preload="metadata" muted poster="newchart.png"></video></div>
    <div class="video-controls">
      <button class="btn btn--sm btn--ghost" type="button" data-video-replay>Replay</button>
      <a class="btn btn--sm btn--ghost" href="resources.html#downloads" data-video-link>Open docs + setup</a>
    </div>
  </div>
</div>'''

def sticky():
    return '''<div class="sticky-cta" role="region" aria-label="Quick actions">
  <div class="container sticky-cta-inner">
    <a class="btn btn--primary" data-glow="1" href="pricing.html">Buy access</a>
    <button class="btn btn--ghost" type="button" data-trial-open>Free trial</button>
  </div>
</div>'''

def base_page(title, desc, canonical, active, body_class, main):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<title>{title}</title>
<meta name="description" content="{desc}"/>
<link rel="canonical" href="https://azrosystems.com/{canonical}"/>
<meta property="og:title" content="{title}"/>
<meta property="og:description" content="{desc}"/>
<meta property="og:image" content="og-card.png"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://azrosystems.com/{canonical}"/>
<meta name="twitter:card" content="summary_large_image"/>
{head_common}
</head>
<body class="{body_class}">
{header(active)}
<main id="main">{main}</main>
{footer()}
{trial_modal()}
{video_modal()}
{sticky()}
</body>
</html>'''

home_main = f'''
<section class="hero hero--split">
  <div class="container hero-inner">
    <div class="hero-text">
      <p class="meta-line">AZRO Systems • Two proof-first TradingView workflows • BTC first</p>
      <h1>Two proof-first TradingView workflows. One calmer weekly process.</h1>
      <p class="lede">Use <strong>BTC Operating System</strong> to turn Bitcoin volatility into a repeatable weekly allocation process. Use <strong>XRP Top/Bottom Detector</strong> to validate cycle conditions with readable on-chart labels, optional context, and alert-ready structure.</p>
      <div class="hero-cta">
        <a class="btn btn--primary" data-glow="1" href="pricing.html">View plans</a>
        <button class="btn btn--ghost" type="button" data-trial-open>Free trial</button>
      </div>
      <p class="legal-note">Invite-only access • works with free TradingView accounts • no card required for the trial</p>
    </div>
    <div class="hero-media">
      <figure class="media-frame media-frame--figure">
        <img src="suite-preview.png" alt="AZRO Systems suite preview showing BTC Operating System and XRP Top/Bottom Detector" width="1600" height="900" loading="eager" decoding="async"/>
        <figcaption class="chart-note">AZRO Systems suite preview: BTC Operating System + XRP Top/Bottom Detector on TradingView.</figcaption>
      </figure>
    </div>
  </div>
</section>
<section class="section section--tight">
  <div class="container">
    <div class="card card-pad card--narrow center stack">
      <h2 class="section-title" style="margin:0;">Choose the workflow that fits your process.</h2>
      <p class="section-sub" style="margin:0;">Start with BTC Operating System if you want a calmer Bitcoin allocation process built around one weekly decision, one suggested amount, and on-chart accountability. Start with XRP Top/Bottom Detector if you want readable cycle-confirmation labels, optional context, and alerts for a disciplined weekly-close routine.</p>
      <div class="grid-2" style="margin-top:18px; text-align:left;">
        <article class="card card-pad product-card">
          <div class="pill-row"><span class="pill">BTC Operating System</span></div>
          <h3 style="margin-top:14px;">A calmer Bitcoin allocation process.</h3>
          <p class="small" style="margin-top:10px;">Turn volatility into a repeatable weekly workflow with one clear action, one suggested amount, and accountability that stays on chart.</p>
          <ul class="bullets compact-bullets">
            <li>One job: BUY / TRIM (optional) / HOLD + amount</li>
            <li>Dashboard-first workflow with policies and risk profiles</li>
            <li>Accountability included: proof vs auto-buy stays on chart</li>
          </ul>
          <div class="btn-row btn-row--center" style="margin-top:18px;">
            <a class="btn btn--sm btn--primary" data-glow="1" href="about.html#btc-guide">Explore BTC</a>
            <a class="btn btn--sm btn--ghost" href="pricing.html#plans">Pricing</a>
          </div>
        </article>
        <article class="card card-pad product-card">
          <div class="pill-row"><span class="pill">XRP Top/Bottom Detector</span></div>
          <h3 style="margin-top:14px;">Cycle confirmation labels for XRP.</h3>
          <p class="small" style="margin-top:10px;">Validate tops, bottoms, and risk conditions with readable on-chart labels, optional context, and an alert-ready weekly workflow.</p>
          <ul class="bullets compact-bullets">
            <li>Readable MAJOR / RADAR / LIGHT / EARLY + risk markers</li>
            <li>Optional context when you want more than labels</li>
            <li>Works with free TradingView accounts</li>
          </ul>
          <div class="btn-row btn-row--center" style="margin-top:18px;">
            <a class="btn btn--sm btn--primary" data-glow="1" href="about.html#xrp-guide">Explore XRP</a>
            <a class="btn btn--sm btn--ghost" href="pricing.html#plans">Pricing</a>
          </div>
        </article>
      </div>
    </div>
  </div>
</section>
<section class="section section--tight" id="access">
  <div class="container">
    <div class="card card-pad card--narrow center stack">
      <h2 class="section-title" style="margin:0;">How access works</h2>
      <p class="section-sub" style="margin:0;">Both products are invite-only TradingView indicators. Choose BTC Operating System, XRP Top/Bottom Detector, or the bundle on Gumroad, add your TradingView username at checkout, and you’ll receive access via TradingView Invite.</p>
      <div class="grid-3" style="margin-top:18px; text-align:left;">
        <div class="card card-pad card--flat step-card"><h3>1) Choose your product</h3><p class="small" style="margin-top:8px;">Pick BTC Operating System, XRP Top/Bottom Detector, or the bundle — lifetime or 6‑month access.</p></div>
        <div class="card card-pad card--flat step-card"><h3>2) Add your TradingView username</h3><p class="small" style="margin-top:8px;">Enter your TradingView handle at checkout so we can grant invite-only access.</p></div>
        <div class="card card-pad card--flat step-card"><h3>3) Access granted</h3><p class="small" style="margin-top:8px;">We add your account to the private script(s) and you load them directly inside TradingView.</p><p class="small" style="margin-top:10px;"><a href="{BTC_TV}" target="_blank" rel="noopener">BTC TradingView listing →</a><br/><a href="{XRP_TV}" target="_blank" rel="noopener">XRP TradingView listing →</a></p></div>
      </div>
      <div class="btn-row btn-row--center" style="margin-top:18px;">
        <a class="btn btn--primary" data-glow="1" href="pricing.html#plans">View plans</a>
        <a class="btn btn--ghost" href="resources.html#product-downloads">Walkthroughs + docs</a>
      </div>
    </div>
  </div>
</section>
<section class="section section--tight" id="product-downloads">
  <div class="container">
    <div class="grid-2 product-docs-grid">
      <article class="card card-pad product-docs-card">
        <h2 class="section-title" style="margin:0;">BTC docs + setup videos</h2>
        <p class="section-sub">Everything for the BTC Operating System in one place — walkthrough, docs pack, validation pack, and listing links.</p>
        <div class="tile-grid tile-grid--docs" style="margin-top:18px;">
          <button class="resource-card tile-btn" type="button" data-label-open data-title="BTC Operating System walkthrough" data-desc="A guided overview of the dashboard-first workflow, policy modes, and proof layer." data-video="videos/btc-overview.mp4" data-video-mode="demo"><span>Watch walkthrough</span></button>
          <a class="resource-card" href="pdfs/btc-documentation-pack-v1.0.0.pdf" target="_blank" rel="noopener"><span>Documentation pack</span></a>
          <a class="resource-card" href="pdfs/btc-customer-validation-pack-v1.0.0.pdf" target="_blank" rel="noopener"><span>Validation pack</span></a>
          <a class="resource-card" href="downloads/btc-complete-kit-v1.0.0.zip" rel="noopener"><span>Complete kit</span></a>
          <a class="resource-card" href="{BTC_TV}" target="_blank" rel="noopener"><span>TradingView listing</span></a>
          <a class="resource-card" href="{BTC_GUM}" target="_blank" rel="noopener"><span>Gumroad page</span></a>
        </div>
      </article>
      <article class="card card-pad product-docs-card">
        <h2 class="section-title" style="margin:0;">XRP docs + setup videos</h2>
        <p class="section-sub">Everything for the XRP Top/Bottom Detector in one place — walkthrough, docs pack, alert guide, and listing links.</p>
        <div class="tile-grid tile-grid--docs" style="margin-top:18px;">
          <button class="resource-card tile-btn" type="button" data-label-open data-title="XRP Top/Bottom Detector walkthrough" data-desc="A short overview of confirmations, optional context, and the weekly-close workflow." data-video="main_h264.mp4" data-video-mode="demo"><span>Watch walkthrough</span></button>
          <a class="resource-card" href="pdfs/xrp-documentation-pack-v1.1.0.pdf" target="_blank" rel="noopener"><span>Documentation pack</span></a>
          <a class="resource-card" href="pdfs/xrp-alert-setup-card-v1.1.0.pdf" target="_blank" rel="noopener"><span>Alert setup card</span></a>
          <a class="resource-card" href="downloads/xrp-complete-kit-v1.1.0.zip" rel="noopener"><span>Complete kit</span></a>
          <a class="resource-card" href="{XRP_TV}" target="_blank" rel="noopener"><span>TradingView listing</span></a>
          <a class="resource-card" href="{XRP_GUM}" target="_blank" rel="noopener"><span>Gumroad page</span></a>
        </div>
      </article>
    </div>
  </div>
</section>
'''

about_main = f'''
<section class="hero">
  <div class="container">
    <div class="card card-pad card--narrow center stack">
      <p class="meta-line" style="margin:0;">About AZRO Systems</p>
      <h1 style="margin:0;">Two systems. One rules-first mindset.</h1>
      <p class="section-sub" style="margin:0 auto; max-width: 720px;">AZRO Systems builds proof-first TradingView workflows that reduce noise, support a written plan, and keep weekly decisions calm enough to follow. BTC Operating System handles cycle-aware Bitcoin allocation; XRP Top/Bottom Detector handles readable cycle confirmations on the weekly close.</p>
    </div>
  </div>
</section>
<section class="section section--tight" id="btc-guide">
  <div class="container">
    <div class="stack" style="gap:18px;">
      <details class="card card-pad product-guide" data-single-open-group="guides">
        <summary class="product-guide__summary">
          <div>
            <h2 style="margin:0;">AZRO Systems BTC Operating System guide</h2>
            <p class="small" style="margin:8px 0 0;">Glossary, walkthrough, and the key dashboard concepts behind the weekly allocation workflow.</p>
          </div>
        </summary>
        <div class="product-guide__body">
          <div class="product-showcase">
            <div class="product-showcase__text">
              <div class="pill-row"><span class="pill">BTC Operating System</span><span class="pill">Dashboard-first</span><span class="pill">Non-custodial</span></div>
              <h3 style="margin-top:14px;">A cycle-aware Bitcoin allocation process.</h3>
              <p class="small" style="margin-top:10px;">A fault-tolerant policy stack built to turn volatility into one calmer weekly process — with one clear action, one suggested amount, and on-chart accountability.</p>
              <ul class="bullets compact-bullets">
                <li>Clear output: BUY / TRIM (optional) / HOLD + matching amount</li>
                <li>Multiple policies and risk profiles for different operator styles</li>
                <li>Invite-only access on TradingView with no exchange connection</li>
              </ul>
              <div class="btn-row btn-row--center" style="margin-top:16px;">
                <button class="btn btn--sm btn--primary" data-glow="1" type="button" data-label-open data-title="BTC Operating System walkthrough" data-desc="A guided overview of the dashboard-first workflow, policy modes, and proof layer." data-video="videos/btc-overview.mp4" data-video-mode="demo">Watch BTC walkthrough</button>
                <a class="btn btn--sm btn--ghost" href="pricing.html#plans">BTC pricing</a>
              </div>
            </div>
            <figure class="media-frame media-frame--figure product-showcase__media"><img src="btc-cover.png" alt="BTC Operating System overview preview" width="1600" height="900" loading="lazy" decoding="async"/><figcaption class="chart-note">Overview preview of the BTC Operating System on TradingView.</figcaption></figure>
          </div>
          <div class="guide-shell" style="margin-top:18px;">
            <h3 style="margin:0 0 6px;">BTC Operating System glossary</h3>
            <p class="small">What the dashboard means, and how it fits into a repeatable Bitcoin allocation process.</p>
            <div class="accordion">
              <details><summary><span class="label-title"><span class="label-name">Action + suggested amount</span><span class="label-meta">One clear weekly output: BUY / TRIM (optional) / HOLD plus a matching amount.</span></span></summary><div class="label-body"><p>The dashboard is designed to keep execution simple: read the action, size the amount, and follow your written process.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="Action + suggested amount" data-desc="How the BTC Operating System turns the dashboard into one calm weekly decision." data-video="videos/btc-action.mp4">Watch example</button></div></div></details>
              <details><summary><span class="label-title"><span class="label-name">Market context</span><span class="label-meta">High-level cycle orientation designed for decisions, not noise.</span></span></summary><div class="label-body"><p>Context is there to frame the week, not to pull you into constant interpretation. The chart stays quiet; the dashboard carries the decision.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="Market context" data-desc="A quick look at the higher-level cycle orientation inside the BTC dashboard." data-video="videos/btc-market.mp4">Watch example</button></div></div></details>
              <details><summary><span class="label-title"><span class="label-name">Modes + risk profiles</span><span class="label-meta">Choose the policy that matches your philosophy, risk tolerance, and time horizon.</span></span></summary><div class="label-body"><p>Stack, Adaptive, Event, and Performance let you choose how the system should behave without changing the underlying framework.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="Modes + risk profiles" data-desc="How the four policy modes and risk profiles shape the weekly workflow." data-video="videos/btc-modes.mp4">Watch example</button></div></div></details>
              <details><summary><span class="label-title"><span class="label-name">Proof vs auto-buy</span><span class="label-meta">BTC-eq, extra sats, and accretion keep the process accountable.</span></span></summary><div class="label-body"><p>The proof layer lets you audit whether the process is actually adding BTC-equivalent versus a simple baseline — without leaving the chart.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="Proof vs auto-buy" data-desc="See how BTC-eq, extra sats, and accretion stay on chart as part of the workflow." data-video="videos/btc-proof.mp4">Watch example</button></div></div></details>
              <details><summary><span class="label-title"><span class="label-name">Alerts (optional)</span><span class="label-meta">Weekly reminders plus rare high-attention prompts.</span></span></summary><div class="label-body"><p>Alerts are there to bring you back when the workflow needs attention — not to create more chart time.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="Alerts" data-desc="How the BTC Operating System uses reminders and high-attention prompts without becoming noisy." data-video="videos/btc-alerts.mp4">Watch example</button></div></div></details>
            </div>
          </div>
        </div>
      </details>

      <details class="card card-pad product-guide" data-single-open-group="guides" id="xrp-guide">
        <summary class="product-guide__summary">
          <div>
            <h2 style="margin:0;">AZRO Systems XRP Top/Bottom Detector guide</h2>
            <p class="small" style="margin:8px 0 0;">Glossary, walkthrough, and the on-chart label system behind the weekly-close process.</p>
          </div>
        </summary>
        <div class="product-guide__body">
          <div class="product-showcase">
            <div class="product-showcase__text">
              <div class="pill-row"><span class="pill">XRP Top/Bottom Detector</span><span class="pill">Weekly-close</span><span class="pill">Free TradingView</span></div>
              <h3 style="margin-top:14px;">Cycle confirmation labels for XRP.</h3>
              <p class="small" style="margin-top:10px;">A proof-first weekly workflow built around readable confirmations, optional context, and alert-ready structure.</p>
              <ul class="bullets compact-bullets">
                <li>MAJOR / RADAR / LIGHT / EARLY label workflow</li>
                <li>Optional context overlays and risk markers</li>
                <li>Built for disciplined weekly-close decision-making</li>
              </ul>
              <div class="btn-row btn-row--center" style="margin-top:16px;">
                <button class="btn btn--sm btn--primary" data-glow="1" type="button" data-label-open data-title="XRP Top/Bottom Detector walkthrough" data-desc="A short overview of confirmations, optional context, and the weekly-close workflow." data-video="main_h264.mp4" data-video-mode="demo">Watch XRP walkthrough</button>
                <a class="btn btn--sm btn--ghost" href="pricing.html#plans">XRP pricing</a>
              </div>
            </div>
            <figure class="media-frame media-frame--figure product-showcase__media"><picture><source srcset="xrp-preview.webp" type="image/webp"/><img src="xrp-preview.png" alt="Chart preview of the XRP Top/Bottom Detector on TradingView" width="1280" height="720" loading="lazy" decoding="async"/></picture><figcaption class="chart-note">Chart preview of the XRP Top/Bottom Detector on TradingView.</figcaption></figure>
          </div>
          <div class="guide-shell" style="margin-top:18px;">
            <h3 style="margin:0 0 6px;">Label glossary (XRP)</h3>
            <p class="small">What each label means, and how it fits into a weekly-close workflow.</p>
            <div class="accordion">
              <details><summary><span class="label-title"><span class="label-name">MAJOR TOP / MAJOR BOTTOM</span><span class="label-meta">Cycle-level confirmations designed to anchor the biggest decisions.</span></span></summary><div class="label-body"><p>Treat these as workflow anchors rather than predictions. Use them to follow your written exposure and exit rules.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="MAJOR TOP / MAJOR BOTTOM" data-video="videos/major.mp4">Watch example</button></div></div></details>
              <details><summary><span class="label-title"><span class="label-name">RADAR TOP / RADAR BOTTOM</span><span class="label-meta">A secondary confirmation track that complements MAJOR labels.</span></span></summary><div class="label-body"><p>RADAR adds structure without demanding more chart time. Use it to support your plan, not to create more noise.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="RADAR TOP / RADAR BOTTOM" data-video="videos/radar.mp4">Watch example</button></div></div></details>
              <details><summary><span class="label-title"><span class="label-name">LIGHT TOP / LIGHT BOTTOM</span><span class="label-meta">Heads-up labels for timing and awareness.</span></span></summary><div class="label-body"><p>LIGHT labels help frame timing between major turns. Leave them on for awareness, or turn them off for a cleaner confirmation-only chart.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="LIGHT TOP / LIGHT BOTTOM" data-video="videos/light.mp4">Watch example</button></div></div></details>
              <details><summary><span class="label-title"><span class="label-name">EARLY TOP / EARLY BOTTOM</span><span class="label-meta">Intra-week staging cues that can appear and disappear.</span></span></summary><div class="label-body"><p>Helpful during the week, but only confirmations persist at the weekly close.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="EARLY TOP / EARLY BOTTOM" data-video="videos/early.mp4">Watch example</button></div></div></details>
              <details><summary><span class="label-title"><span class="label-name">Risk triangles + context overlays</span><span class="label-meta">Optional layers that add regime context without clutter.</span></span></summary><div class="label-body"><p>Use these to tighten rules, reduce exposure, or avoid emotional decision-making — not as direct entries.</p><div class="label-actions"><button class="btn btn--sm btn--ghost" type="button" data-label-open data-title="Risk triangles + context overlays" data-video="videos/risk.mp4">Watch example</button></div></div></details>
            </div>
            <div class="card card-pad card--flat" style="margin-top:18px; background: rgba(118,152,255,.06); border-color: rgba(118,152,255,.22);">
              <h3 style="margin:0 0 6px; font-size:1.05rem;">Alert setup (one-time)</h3>
              <p style="margin:0; color: var(--text-sub);">Create TradingView alerts for the confirmations you want to monitor. The Alert Setup Card walks through the recommended defaults.</p>
              <div class="btn-row btn-row--center btn-row--stack-sm" style="margin-top:14px;">
                <a class="btn btn--sm" href="resources.html#xrp-docs">XRP docs pack</a>
                <a class="btn btn--sm btn--ghost" href="pdfs/xrp-alert-setup-card-v1.1.0.pdf" target="_blank" rel="noopener">Alert Setup Card (PDF)</a>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</section>
'''

features_main = f'''
<section class="hero">
  <div class="container">
    <div class="card card-pad card--narrow center stack">
      <p class="meta-line" style="margin:0;">Features</p>
      <h1 style="margin:0;">Features built for disciplined execution.</h1>
      <p class="section-sub" style="margin:0 auto; max-width:720px;">Two tools, one rules-first mindset: weekly clarity, readable outputs, and a workflow you can actually follow.</p>
    </div>
  </div>
</section>
<section class="section section--tight">
  <div class="container">
    <div class="stack" style="gap:18px;">
      <details class="card card-pad product-guide" data-single-open-group="feature-cards">
        <summary class="product-guide__summary"><div><h2 style="margin:0;">BTC Operating System features</h2><p class="small" style="margin:8px 0 0;">What makes the BTC Operating System feel different without changing the clean AZRO layout system.</p></div></summary>
        <div class="product-guide__body">
          <div class="product-showcase">
            <div class="product-showcase__text">
              <div class="pill-row"><span class="pill">BTC Operating System</span></div>
              <h3 style="margin-top:14px;">A cycle-aware Bitcoin allocation process.</h3>
              <p class="small" style="margin-top:10px;">Turn volatility into one clear weekly process built around one decision, one suggested amount, and accountability that stays on chart.</p>
              <div class="feature-mini-grid" style="margin-top:18px;">
                <div class="feature-card"><h3>One clear weekly output</h3><p>BUY / TRIM (optional) / HOLD + a suggested amount sized to your plan.</p></div>
                <div class="feature-card"><h3>Dashboard-first</h3><p>Stripped of chart clutter so the decision stays readable at a glance.</p></div>
                <div class="feature-card"><h3>Modes + risk profiles</h3><p>Stack, Adaptive, Event, and Performance with Conservative, Balanced, and Aggressive profiles.</p></div>
                <div class="feature-card"><h3>Proof vs auto-buy</h3><p>BTC-eq, extra sats, and accretion keep the process accountable versus a simple baseline.</p></div>
              </div>
              <div class="btn-row btn-row--center" style="margin-top:18px;">
                <button class="btn btn--sm btn--primary" data-glow="1" type="button" data-label-open data-title="BTC Operating System walkthrough" data-desc="A guided overview of the dashboard-first workflow, policy modes, and proof layer." data-video="videos/btc-overview.mp4" data-video-mode="demo">Watch BTC walkthrough</button>
                <a class="btn btn--sm btn--ghost" href="pricing.html#plans">BTC pricing</a>
              </div>
            </div>
            <figure class="media-frame media-frame--figure product-showcase__media"><img src="btc-dashboard-first.png" alt="BTC Operating System dashboard-first preview" width="1600" height="900" loading="lazy" decoding="async"/><figcaption class="chart-note">Dashboard-first view of the BTC Operating System on TradingView.</figcaption></figure>
          </div>
        </div>
      </details>
      <details class="card card-pad product-guide" data-single-open-group="feature-cards">
        <summary class="product-guide__summary"><div><h2 style="margin:0;">XRP Top/Bottom Detector features</h2><p class="small" style="margin:8px 0 0;">The same clean layout system, but centered on readable on-chart confirmations for XRP.</p></div></summary>
        <div class="product-guide__body">
          <div class="product-showcase">
            <div class="product-showcase__text">
              <div class="pill-row"><span class="pill">XRP Top/Bottom Detector</span></div>
              <h3 style="margin-top:14px;">Cycle confirmation labels for XRP.</h3>
              <p class="small" style="margin-top:10px;">A proof-first weekly workflow built around readable confirmations, optional context, and alert-ready structure.</p>
              <div class="feature-mini-grid" style="margin-top:18px;">
                <div class="feature-card"><h3>Core label suite</h3><p>MAJOR, RADAR, LIGHT, EARLY, and risk markers built for a weekly-close workflow.</p></div>
                <div class="feature-card"><h3>Weekly-close confirmations</h3><p>Designed to matter on the weekly close instead of feeding intra-week noise.</p></div>
                <div class="feature-card"><h3>Optional context overlays</h3><p>Optional context when you want more than labels.</p></div>
                <div class="feature-card"><h3>Alert-ready</h3><p>Set TradingView alerts so you don’t need to watch the chart all day.</p></div>
              </div>
              <div class="btn-row btn-row--center" style="margin-top:18px;">
                <button class="btn btn--sm btn--primary" data-glow="1" type="button" data-label-open data-title="XRP Top/Bottom Detector walkthrough" data-desc="A short overview of confirmations, optional context, and the weekly-close workflow." data-video="main_h264.mp4" data-video-mode="demo">Watch XRP walkthrough</button>
                <a class="btn btn--sm btn--ghost" href="pricing.html#plans">XRP pricing</a>
              </div>
            </div>
            <figure class="media-frame media-frame--figure product-showcase__media"><picture><source srcset="xrp-preview.webp" type="image/webp"/><img src="xrp-preview.png" alt="Live chart view of the XRP Top/Bottom Detector on the weekly chart" width="1280" height="720" loading="lazy" decoding="async"/></picture><figcaption class="chart-note">Live chart view of the XRP Top/Bottom Detector on the weekly chart.</figcaption></figure>
          </div>
        </div>
      </details>
    </div>
  </div>
</section>
'''

pricing_main = f'''
<section class="hero">
  <div class="container">
    <div class="card card-pad card--narrow center stack">
      <p class="meta-line" style="margin:0;">Pricing</p>
      <h1 style="margin:0;">Choose the access structure that fits your process.</h1>
      <p class="section-sub" style="margin:0 auto; max-width:720px;">Start with BTC Operating System if you want a calmer Bitcoin allocation system. Choose XRP Top/Bottom Detector if you want cycle confirmation labels. Choose the bundle if you want both under one rules-first workflow.</p>
      <div class="btn-row btn-row--center" style="margin-top:10px;">
        <a class="btn btn--sm btn--primary" data-glow="1" href="#plans">View plans</a>
        <button class="btn btn--sm btn--ghost" data-trial-open type="button">Free trial</button>
      </div>
    </div>
  </div>
</section>
<section class="section section--tight" id="plans">
  <div class="container">
    <div class="card card-pad pricing-section-shell">
      <h2 class="section-title center" style="margin:0;">Lifetime access</h2>
      <p class="section-sub center" style="margin-top:10px;">One-time purchase. Invite-only TradingView access. Ongoing updates included.</p>
      <div class="pricing-3up" style="margin-top:22px;">
        <article class="pricing-card plan-card">
          <div class="pill-row"><span class="pill">BTC Operating System</span></div>
          <div class="price-big" style="margin-top:12px;">$2,000</div>
          <p class="small" style="margin-top:8px;">Lifetime access (one-time)</p>
          <ul class="bullets compact-bullets">
            <li>BUY / TRIM (optional) / HOLD + suggested amount</li>
            <li>Dashboard-first workflow with modes and risk profiles</li>
            <li>Built-in proof vs auto-buy (BTC-eq, extra sats, accretion)</li>
          </ul>
          <div class="btn-row btn-row--center" style="margin-top:18px;"><a class="btn btn--sm btn--primary" data-glow="1" href="{BTC_GUM}" target="_blank" rel="noopener">Buy lifetime</a></div>
          <p class="small center" style="margin-top:12px;">Best for long-term allocators who want the full operating process.</p>
        </article>
        <article class="pricing-card plan-card">
          <div class="pill-row"><span class="pill">Bundle (BTC + XRP)</span></div>
          <div class="price-big" style="margin-top:12px;">$2,100</div>
          <p class="small" style="margin-top:8px;">Lifetime access (one-time)</p>
          <ul class="bullets compact-bullets">
            <li>Full access to both products</li>
            <li>One weekly workflow for Bitcoin allocation + XRP confirmation</li>
            <li>Saves $100 vs buying lifetime access separately</li>
          </ul>
          <div class="btn-row btn-row--center" style="margin-top:18px;"><a class="btn btn--sm btn--primary" data-glow="1" href="mailto:{SUPPORT}?subject=AZRO%20bundle%20lifetime%20access" >Request bundle</a></div>
          <p class="small center" style="margin-top:12px;">Best for users who want both markets covered with one rules-first mindset.</p>
        </article>
        <article class="pricing-card plan-card">
          <div class="pill-row"><span class="pill">XRP Detector</span></div>
          <div class="price-big" style="margin-top:12px;">$200</div>
          <p class="small" style="margin-top:8px;">Lifetime access (one-time)</p>
          <ul class="bullets compact-bullets">
            <li>MAJOR / RADAR / LIGHT / EARLY + risk markers</li>
            <li>Optional context overlays + alert-ready workflow</li>
            <li>Built for a clear weekly-close confirmation process</li>
          </ul>
          <div class="btn-row btn-row--center" style="margin-top:18px;"><a class="btn btn--sm btn--primary" data-glow="1" href="{XRP_GUM}" target="_blank" rel="noopener">Buy lifetime</a></div>
          <p class="small center" style="margin-top:12px;">Best for users who want the XRP workflow without the full suite.</p>
        </article>
      </div>
    </div>
  </div>
</section>
<section class="section section--tight">
  <div class="container">
    <div class="card card-pad pricing-section-shell">
      <h2 class="section-title center" style="margin:0;">6-month access</h2>
      <p class="section-sub center" style="margin-top:10px;">A lower up-front way to run the workflow. Access stays active for the paid period.</p>
      <div class="pricing-3up compact-plan-grid" style="margin-top:22px;">
        <article class="pricing-card plan-card plan-card--compact">
          <div class="pill-row"><span class="pill">BTC Operating System</span></div>
          <div class="price-big" style="margin-top:12px;">$500</div>
          <p class="small" style="margin-top:8px;">6-month access</p>
          <ul class="bullets compact-bullets">
            <li>Full BTC workflow for 6 months</li>
            <li>Good for validating the process before lifetime</li>
          </ul>
          <div class="btn-row btn-row--center" style="margin-top:18px;"><a class="btn btn--sm btn--ghost" href="mailto:{SUPPORT}?subject=AZRO%20BTC%206-month%20access">Request 6-month</a></div>
        </article>
        <article class="pricing-card plan-card plan-card--compact">
          <div class="pill-row"><span class="pill">Bundle (BTC + XRP)</span></div>
          <div class="price-big" style="margin-top:12px;">$525</div>
          <p class="small" style="margin-top:8px;">6-month access</p>
          <ul class="bullets compact-bullets">
            <li>Both products for 6 months</li>
            <li>A lower-commitment way to run the full suite</li>
          </ul>
          <div class="btn-row btn-row--center" style="margin-top:18px;"><a class="btn btn--sm btn--ghost" href="mailto:{SUPPORT}?subject=AZRO%20bundle%206-month%20access">Request 6-month</a></div>
        </article>
        <article class="pricing-card plan-card plan-card--compact">
          <div class="pill-row"><span class="pill">XRP Detector</span></div>
          <div class="price-big" style="margin-top:12px;">$75</div>
          <p class="small" style="margin-top:8px;">6-month access</p>
          <ul class="bullets compact-bullets">
            <li>Full XRP workflow for 6 months</li>
            <li>A simple way to validate the indicator before lifetime</li>
          </ul>
          <div class="btn-row btn-row--center" style="margin-top:18px;"><a class="btn btn--sm btn--ghost" href="mailto:{SUPPORT}?subject=AZRO%20XRP%206-month%20access">Request 6-month</a></div>
        </article>
      </div>
    </div>
  </div>
</section>
<section class="section section--tight" id="access">
  <div class="container">
    <div class="card card-pad card--narrow center stack">
      <h2 class="section-title" style="margin:0;">How access works</h2>
      <p class="section-sub" style="margin:0;">All plans are delivered as invite-only TradingView access after Gumroad checkout.</p>
      <div class="grid-3" style="margin-top:18px; text-align:left;">
        <div class="card card-pad card--flat step-card"><h3>1) Purchase</h3><p class="small" style="margin-top:8px;">Choose BTC, XRP, or the bundle on Gumroad — lifetime or 6‑month access.</p></div>
        <div class="card card-pad card--flat step-card"><h3>2) Add your TradingView username</h3><p class="small" style="margin-top:8px;">Enter your TradingView handle at checkout so we can grant access to the private script(s).</p></div>
        <div class="card card-pad card--flat step-card"><h3>3) Get invited</h3><p class="small" style="margin-top:8px;">We add your account to the invite list. Access is typically granted within 24 business hours.</p></div>
      </div>
      <div class="card card-pad card--flat center" style="margin-top:16px; background: rgba(255,255,255,.03); border-color: rgba(181,195,237,.12);">Non-custodial. No keys, no exchange connections, no auto-trading — you stay in control.</div>
    </div>
  </div>
</section>
'''

resources_main = f'''
<section class="hero">
  <div class="container">
    <div class="card card-pad card--narrow center stack">
      <p class="meta-line" style="margin:0;">Resources</p>
      <h1 style="margin:0;">Documentation, walkthroughs, and support.</h1>
      <p class="section-sub" style="margin:0 auto; max-width:720px;">Start with the overview that matches your product, then use the walkthroughs, PDFs, and disclosures to validate the workflow.</p>
    </div>
  </div>
</section>
<section class="section section--tight" id="product-downloads">
  <div class="container">
    <div class="grid-2 product-docs-grid">
      <article class="card card-pad product-docs-card" id="btc-docs">
        <h2 class="section-title" style="margin:0;">BTC docs + setup videos</h2>
        <p class="section-sub">Everything for the BTC Operating System in one place — walkthrough, docs pack, validation pack, and listing links.</p>
        <div class="tile-grid tile-grid--docs" style="margin-top:18px;">
          <button class="resource-card tile-btn" type="button" data-label-open data-title="BTC Operating System walkthrough" data-desc="A guided overview of the dashboard-first workflow, policy modes, and proof layer." data-video="videos/btc-overview.mp4" data-video-mode="demo"><span>Watch walkthrough</span></button>
          <a class="resource-card" href="pdfs/btc-documentation-pack-v1.0.0.pdf" target="_blank" rel="noopener"><span>Documentation pack</span></a>
          <a class="resource-card" href="pdfs/btc-customer-validation-pack-v1.0.0.pdf" target="_blank" rel="noopener"><span>Validation pack</span></a>
          <a class="resource-card" href="downloads/btc-complete-kit-v1.0.0.zip" rel="noopener"><span>Complete kit</span></a>
          <a class="resource-card" href="{BTC_TV}" target="_blank" rel="noopener"><span>TradingView listing</span></a>
          <a class="resource-card" href="{BTC_GUM}" target="_blank" rel="noopener"><span>Gumroad page</span></a>
        </div>
      </article>
      <article class="card card-pad product-docs-card" id="xrp-docs">
        <h2 class="section-title" style="margin:0;">XRP docs + setup videos</h2>
        <p class="section-sub">Everything for the XRP Top/Bottom Detector in one place — walkthrough, docs pack, alert guide, and listing links.</p>
        <div class="tile-grid tile-grid--docs" style="margin-top:18px;">
          <button class="resource-card tile-btn" type="button" data-label-open data-title="XRP Top/Bottom Detector walkthrough" data-desc="A short overview of confirmations, optional context, and the weekly-close workflow." data-video="main_h264.mp4" data-video-mode="demo"><span>Watch walkthrough</span></button>
          <a class="resource-card" href="pdfs/xrp-documentation-pack-v1.1.0.pdf" target="_blank" rel="noopener"><span>Documentation pack</span></a>
          <a class="resource-card" href="pdfs/xrp-alert-setup-card-v1.1.0.pdf" target="_blank" rel="noopener"><span>Alert setup card</span></a>
          <a class="resource-card" href="downloads/xrp-complete-kit-v1.1.0.zip" rel="noopener"><span>Complete kit</span></a>
          <a class="resource-card" href="{XRP_TV}" target="_blank" rel="noopener"><span>TradingView listing</span></a>
          <a class="resource-card" href="{XRP_GUM}" target="_blank" rel="noopener"><span>Gumroad page</span></a>
        </div>
      </article>
    </div>
    <div class="grid-2" style="margin-top:18px;">
      <article class="card card-pad">
        <h2 class="section-title" style="margin:0 0 6px; font-size:1.5rem;">Social updates</h2>
        <p class="section-sub" style="margin:0;">Follow on X and Instagram for workflow tips, release notes, promotions, and new product launches.</p>
        <div class="btn-row btn-row--center" style="margin-top:18px;">
          <a class="btn btn--sm btn--ghost" href="{X_LINK}" target="_blank" rel="noopener">Follow on X</a>
          <a class="btn btn--sm btn--ghost" href="{INSTAGRAM}" target="_blank" rel="noopener">Follow on Instagram</a>
        </div>
      </article>
      <article class="card card-pad" id="support">
        <h2 class="section-title" style="margin:0 0 6px; font-size:1.5rem;">Support</h2>
        <p class="section-sub" style="margin:0;">Need help with access, setup, or your TradingView username? Use the email below and we’ll point you to the right next step.</p>
        <p class="small" style="margin-top:16px;"><a href="mailto:{SUPPORT}">{SUPPORT}</a></p>
        <p class="small" style="margin-top:8px;">Azro Labs LLC • UT Entity #14569235-0160</p>
        <div class="btn-row btn-row--center" style="margin-top:18px;">
          <a class="btn btn--primary" data-glow="1" href="mailto:{SUPPORT}">Email support</a>
          <a class="btn btn--ghost" href="pricing.html#plans">View plans</a>
        </div>
      </article>
    </div>
  </div>
</section>
'''

pages = {
'index.html': base_page('AZRO Systems — BTC Operating System + XRP Top/Bottom Detector','Proof-first TradingView workflows for Bitcoin allocation and XRP cycle confirmation.','index.html','index.html','home',home_main),
'about.html': base_page('About — AZRO Systems BTC Operating System + XRP Top/Bottom Detector','About AZRO Systems and the two proof-first TradingView workflows: BTC Operating System and XRP Top/Bottom Detector.','about.html','about.html','',about_main),
'features.html': base_page('Features — AZRO Systems BTC Operating System + XRP Top/Bottom Detector','Features of the AZRO Systems BTC Operating System and XRP Top/Bottom Detector.','features.html','features.html','',features_main),
'pricing.html': base_page('Pricing — AZRO Systems BTC Operating System + XRP Top/Bottom Detector','Pricing for BTC Operating System, XRP Top/Bottom Detector, and the bundle.','pricing.html','pricing.html','',pricing_main),
'resources.html': base_page('Resources — AZRO Systems','Documentation, walkthroughs, and support for AZRO Systems products.','resources.html','resources.html','',resources_main),
}
for name, html in pages.items():
    (base / name).write_text(html)
print('pages written')
