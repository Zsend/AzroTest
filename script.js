/* Cursor-reactive glow for buttons (optimized; desktop pointers only) */
(function(){
  if (!window.matchMedia('(pointer:fine)').matches) return;

  const RIM_MIN = 0.15;
  const RIM_MAX = 0.60;
  const CENTRE_MAX = 0.40;

  let activeBtn = null;
  let raf = 0;
  let lastEvt = null;

  function reset(btn){
    if (!btn) return;
    btn.style.setProperty('--edgeGlow', RIM_MIN);
    btn.style.setProperty('--centerGlow', 0);
  }

  function update(e){
    if (!activeBtn || !e) return;
    const rect = activeBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const maxDist = Math.hypot(rect.width, rect.height) * 2;
    const proximity = Math.max(0, 1 - dist / maxDist);
    const rim = RIM_MIN + (RIM_MAX - RIM_MIN) * proximity;

    activeBtn.style.setProperty('--edgeGlow', rim.toFixed(3));

    const inside = (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom
    );

    if (inside){
      activeBtn.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      activeBtn.style.setProperty('--y', `${((e.clientY - rect.top)  / rect.height) * 100}%`);
      activeBtn.style.setProperty('--centerGlow', (CENTRE_MAX * proximity).toFixed(3));
    }else{
      activeBtn.style.setProperty('--centerGlow', 0);
    }
  }

  function onMove(e){
    lastEvt = e;
    if (raf) return;
    raf = window.requestAnimationFrame(()=>{
      raf = 0;
      update(lastEvt);
    });
  }

  document.addEventListener('pointerover', (e)=>{
    const btn = e.target && e.target.closest ? e.target.closest('.btn') : null;
    if (!btn) return;
    if (activeBtn && activeBtn !== btn) reset(activeBtn);
    activeBtn = btn;
  }, {passive:true});

  document.addEventListener('pointerout', (e)=>{
    if (!activeBtn) return;
    const leavingBtn = e.target && e.target.closest ? e.target.closest('.btn') : null;
    if (leavingBtn && leavingBtn === activeBtn){
      const next = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('.btn') : null;
      if (!next){
        reset(activeBtn);
        activeBtn = null;
      }
    }
  }, {passive:true});

  window.addEventListener('pointermove', onMove, {passive:true});

  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('.btn').forEach((btn)=>{
      btn.style.setProperty('--edgeGlow', RIM_MIN);
      btn.style.setProperty('--centerGlow', 0);
    });
  });
})();

/* Premium sticky header depth (adds class only; CSS controls visuals) */
(function(){
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = ()=>{
    header.classList.toggle('is-scrolled', (window.scrollY || 0) > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
})();



/* === Layout runtime helpers (safe) === */
(function(){
  function updateCTAPad(){
    var el = document.querySelector('[data-sticky-cta]');
    var h = 0;
    if (el){
      var r = el.getBoundingClientRect();
      h = Math.ceil(r.height || 0);
    }
    document.documentElement.style.setProperty('--cta-bottom-h', h + 'px');
  }

  function init(){
    updateCTAPad();

    var el = document.querySelector('[data-sticky-cta]');
    if (el && typeof ResizeObserver === 'function'){
      try{
        var ro = new ResizeObserver(function(){ updateCTAPad(); });
        ro.observe(el);
      }catch(_){ /* ignore */ }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', updateCTAPad);
  window.addEventListener('resize', updateCTAPad);
  init();
})();

/* =====================================================================
   Global Free Trial modal + dual-CTA support (2025-12-16)
   ===================================================================== */
(function(){
  const GUMROAD_URL = 'https://azrosystems.gumroad.com/l/kuvbu';
  const TRIAL_CODE = 'AZRO‑2WEEK‑FREE'; // keep the exact dash

  function ensureTrialModal(){
    if (document.getElementById('trialModal')) return;

    const html = `
<dialog class="azro-modal" id="trialModal" aria-labelledby="trialTitle">
  <form method="dialog">
    <div class="azro-modal__head">
      <div>
        <h3 class="azro-modal__title" id="trialTitle">Two‑week Free Trial</h3>
        <p class="azro-modal__sub">Unlock 14 days of access — no complex setup.</p>
      </div>
      <button class="azro-modal__close" value="close" aria-label="Close">Close</button>
    </div>

    <div class="azro-modal__scroll">
      <div class="azro-modal__body">
        <div class="azro-modal__text">
          <span class="azro-pill">Welcome offer</span>
          <p>Use this code at checkout to claim your two‑week free access:</p>

          <div class="trial-code">
            <code data-trial-code>${TRIAL_CODE}</code>
            <button type="button" class="azro-modal__copy" data-copy-trial>Copy code</button>
          </div>

          <p class="azro-modal__muted">Redeem on Gumroad when you check out.</p>
          <div class="azro-modal__redeem-cta">
            <a class="btn btn--primary" href="${GUMROAD_URL}" rel="noopener">Redeem on Gumroad</a>
          </div>
        </div>

        <div class="azro-modal__media">
          <div class="azro-video" role="region" aria-label="Free trial info">
            <div class="azro-video__ph">
              On‑chart labels and alerts for top/bottom timing—Early, Light, Radar, and Major—plus Risk Levels and Altcoin Warnings.
              All features included. 14‑day access.
            </div>
          </div>

          <div class="trial-instructions">
            <ul class="trial-steps-tight">
              <li><strong>No card required</strong> at Gumroad checkout.</li>
              <li>Add your <strong>TradingView username</strong> (works with a <strong>free account</strong>).</li>
              <li>Access within <strong>24 hours</strong>.</li>
              <li>In TradingView: <em>Indicators → Invite‑only Scripts</em> → <strong>AZRO Systems XRP Top/Bottom — Invite‑Only</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="azro-modal__foot">
      <span>Questions? <strong>support@azrosystems.com</strong></span>
      <button class="azro-modal__close" value="close">Done</button>
    </div>
  </form>
</dialog>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function safeShowModal(modal){
    if (!modal) return;

    // Fallback for browsers without <dialog> support
    if (typeof modal.showModal !== 'function'){
      // Send users to the About page which contains the trial offer details
      try { window.location.href = 'about.html#trial'; } catch(_){}
      return;
    }

    if (modal.open) return;
    try { modal.showModal(); } catch(_){}
  }

  function bindTrialModal(){
    ensureTrialModal();
    const modal = document.getElementById('trialModal');
    if (!modal) return;

    // Openers
    document.querySelectorAll('[data-open-trial]').forEach((el)=>{
      if (el.__azroTrialBound) return;
      el.addEventListener('click', ()=> safeShowModal(modal));
      el.__azroTrialBound = true;
    });

    // Backdrop click closes (if supported)
    if (!modal.__azroTrialBackdropBound){
      modal.addEventListener('click', (e)=>{ if (e.target === modal) { try{ modal.close(); }catch(_){ modal.removeAttribute('open'); } } });
      modal.__azroTrialBackdropBound = true;
    }

    // Copy code button
    const copyBtn = modal.querySelector('[data-copy-trial]') || modal.querySelector('#copyTrialCode');
    const codeEl  = modal.querySelector('[data-trial-code]')  || modal.querySelector('#trialCode');
    if (copyBtn && codeEl && !copyBtn.__azroCopyBound){
      copyBtn.addEventListener('click', async ()=>{
        const code = (codeEl.textContent || '').trim();
        if (!code) return;

        const setTempLabel = (label, ms)=>{
          const prev = copyBtn.textContent;
          copyBtn.textContent = label;
          window.setTimeout(()=>{ copyBtn.textContent = prev; }, ms || 1200);
        };

        try{
          await navigator.clipboard.writeText(code);
          setTempLabel('Copied!', 1200);
        }catch(_){
          // Fallback: select the code text for manual copy
          try{
            const range = document.createRange();
            range.selectNodeContents(codeEl);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            setTempLabel('Select + copy', 2000);
          }catch(__){
            setTempLabel('Copy manually', 2000);
          }
        }
      });
      copyBtn.__azroCopyBound = true;
    }

    // Auto-open if URL hash includes "trial"
    const hash = (window.location.hash || '').toLowerCase();
    if (hash.includes('trial')){
      window.setTimeout(()=> safeShowModal(modal), 200);
    }
  }

  document.addEventListener('DOMContentLoaded', bindTrialModal);
  window.addEventListener('load', bindTrialModal);
})();
