/*
 * Reserve Standard — Stealth Gate v103 launch-ready
 *
 * Self-contained access gate for private founding-release traffic.
 * Runs before the main site script and prevents content flash until access
 * is verified. This is a lightweight client gate, not authentication.
 */
(function () {
  var docEl = document.documentElement;

  var pendingStyle = document.createElement('style');
  pendingStyle.id = 'rs-gate-pending-style';
  pendingStyle.textContent = [
    'html.rs-gate-pending,html.rs-gate-pending body,html.rs-gate-locked,html.rs-gate-locked body{',
    'width:100%!important;height:100%!important;min-height:100%!important;overflow:hidden!important;',
    'overscroll-behavior:none!important;background:#041225!important;}',
    'html.rs-gate-pending body,html.rs-gate-locked body{visibility:hidden!important;position:fixed!important;inset:0!important;}',
    'html.rs-gate-locked #rs-gate-overlay,html.rs-gate-pending #rs-gate-overlay{visibility:visible!important;}'
  ].join('');
  document.head.appendChild(pendingStyle);
  docEl.classList.add('rs-gate-pending');
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }

  var STORAGE_KEY = 'rs_gate_unlocked';
  // Real hash is loaded from site-config.js. Empty fallback means no input matches
  // if site-config.js fails to load — gate stays locked.
  var DEFAULT_HASH = '';
  var expectedHash = (window.RS_CONFIG && window.RS_CONFIG.gateHash) || DEFAULT_HASH;

  var alreadyUnlocked = false;
  try {
    alreadyUnlocked = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1');
  } catch (e) {
    alreadyUnlocked = false;
  }
  if (alreadyUnlocked) {
    docEl.classList.remove('rs-gate-pending');
    // Respect the customer's current scroll position on normal revisits.
    // The first unlock handles top-of-page positioning; repeated forced scrolls
    // made mobile Safari feel jumpy.
    return;
  }

  var gateStyle = document.createElement('style');
  gateStyle.id = 'rs-gate-style';
  gateStyle.textContent = [
    '#rs-gate-overlay{position:fixed;inset:0;z-index:2147483647;width:100vw;height:100vh;height:100dvh;min-height:100svh;max-height:100dvh;',
    'display:grid;place-items:center;visibility:visible!important;overflow:hidden;overscroll-behavior:none;overscroll-behavior-y:none;touch-action:none;',
    'padding:clamp(18px,4vw,42px);box-sizing:border-box;color:#F4F1E8;background-color:#061328;',
    'font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    'background:radial-gradient(circle at 18% 14%,rgba(111,232,213,.125),transparent 34%),',
    'radial-gradient(circle at 82% 78%,rgba(145,162,183,.115),transparent 38%),',
    'linear-gradient(145deg,#102947 0%,#071B34 44%,#041225 100%);}',
    '#rs-gate-overlay::before{content:"";position:absolute;inset:0;pointer-events:none;',
    'background:linear-gradient(180deg,rgba(251,248,241,.070),rgba(244,241,232,0) 32%,rgba(0,0,0,.10) 100%);}',
    '#rs-gate-overlay::after{content:"";position:absolute;left:0;right:0;top:0;height:2px;',
    'background:linear-gradient(90deg,rgba(8,127,115,.24),rgba(111,232,213,.90),rgba(145,162,183,.64),rgba(111,232,213,0));opacity:.92;}',
    '#rs-gate-overlay .rs-gate-card{position:relative;width:min(100%,548px);padding:clamp(30px,4vw,46px);',
    'border-radius:30px;border:1px solid rgba(255,255,255,.11);',
    'background:linear-gradient(180deg,rgba(255,255,255,.066),rgba(255,255,255,.034));',
    'box-shadow:0 38px 110px rgba(3,10,24,.42),inset 0 1px 0 rgba(255,255,255,.10);',
    'backdrop-filter:saturate(150%) blur(18px);-webkit-backdrop-filter:saturate(150%) blur(18px);overflow:hidden;}',
    '#rs-gate-overlay .rs-gate-card::before{content:"";position:absolute;left:clamp(24px,4vw,44px);right:clamp(24px,4vw,44px);top:0;height:1px;',
    'background:linear-gradient(90deg,rgba(111,232,213,0),rgba(111,232,213,.50),rgba(159,184,214,.22),rgba(111,232,213,0));}',
    '#rs-gate-overlay .rs-gate-lockup{display:flex;align-items:center;gap:14px;margin-bottom:clamp(28px,4vw,38px);}',
    '#rs-gate-overlay .rs-gate-mark{width:46px;height:46px;flex:0 0 46px;border-radius:12px;box-shadow:0 14px 30px rgba(0,0,0,.18);}',
    '#rs-gate-overlay .rs-gate-name{font-size:12px;line-height:1.2;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#fff;}',
    '#rs-gate-overlay .rs-gate-eyebrow{font-size:12px;letter-spacing:.19em;text-transform:uppercase;color:#6FE8D5;margin:0 0 15px;font-weight:700;}',
    '#rs-gate-overlay .rs-gate-title{font-family:"Iowan Old Style","New York","Source Serif 4",Georgia,serif;font-size:clamp(2.35rem,6vw,3.45rem);',
    'font-weight:700;margin:0;letter-spacing:-.055em;line-height:.96;color:#fff;text-wrap:balance;}',
    '#rs-gate-overlay .rs-gate-lead{color:#DCE6F1;margin:18px 0 0;line-height:1.72;font-size:16px;max-width:41rem;text-wrap:pretty;}',
    '#rs-gate-overlay #rs-gate-form{margin:clamp(28px,4vw,36px) 0 0;}',
    '#rs-gate-overlay .rs-gate-field{display:block;text-align:left;}',
    '#rs-gate-overlay .rs-gate-label{display:block;margin:0 0 10px;color:#B7C6D8;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;}',
    '#rs-gate-overlay #rs-gate-input{width:100%;height:56px;padding:0 16px;border:1px solid rgba(255,255,255,.16);',
    'background:rgba(255,255,255,.042);color:#FBF8F1;font-size:16px;border-radius:16px;box-sizing:border-box;',
    'font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);transition:border-color .18s ease,box-shadow .18s ease,background-color .18s ease;}',
    '#rs-gate-overlay #rs-gate-input:focus,#rs-gate-overlay #rs-gate-input:focus-visible{outline:0!important;outline-offset:0!important;border-color:rgba(111,232,213,.58);background:rgba(255,255,255,.052);box-shadow:0 0 0 1px rgba(111,232,213,.20),0 10px 26px rgba(2,8,20,.15),inset 0 1px 0 rgba(255,255,255,.066);}',
    '#rs-gate-overlay #rs-gate-input[aria-invalid="true"]{border-color:rgba(245,166,166,.72);box-shadow:0 0 0 4px rgba(245,166,166,.10),inset 0 1px 0 rgba(255,255,255,.06);}',
    '#rs-gate-overlay #rs-gate-input::placeholder{color:#8CA0B8;}',
    '#rs-gate-overlay #rs-gate-submit{width:100%;min-height:56px;margin-top:12px;padding:15px 18px;border:1px solid rgba(255,255,255,.10);',
    'background:linear-gradient(180deg,#102B4D 0%,#06172D 100%);color:#fff;font-size:12px;font-weight:800;border-radius:16px;cursor:pointer;',
    'font-family:inherit;letter-spacing:.13em;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.11),0 20px 46px rgba(3,10,24,.32);',
    'transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease,filter .22s ease;}',
    '#rs-gate-overlay #rs-gate-submit:hover{transform:translateY(-1px);filter:saturate(1.04);box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 24px 54px rgba(3,10,24,.38);}',
    '#rs-gate-overlay #rs-gate-submit:focus-visible{outline:2px solid rgba(111,232,213,.70);outline-offset:4px;box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 22px 50px rgba(3,10,24,.34);}',
    '#rs-gate-overlay #rs-gate-submit:disabled{cursor:wait;opacity:.72;transform:none;}',
    '#rs-gate-overlay #rs-gate-error{color:#F5A6A6;margin:14px 0 0;font-size:13px;line-height:1.5;min-height:20px;font-weight:600;}',
    '#rs-gate-overlay .rs-gate-compliance{margin:clamp(24px,4vw,34px) 0 0;padding-top:20px;border-top:1px solid rgba(255,255,255,.10);',
    'color:#A1B2C8;font-size:12px;line-height:1.65;}',
    '#rs-gate-overlay.is-unlocking{opacity:0;transform:scale(.992);transition:opacity .24s ease,transform .24s ease;}',
    '@media(max-width:520px){#rs-gate-overlay{padding:20px;}#rs-gate-overlay .rs-gate-card{border-radius:24px;padding:28px 22px;}#rs-gate-overlay .rs-gate-mark{width:42px;height:42px;flex-basis:42px;}#rs-gate-overlay .rs-gate-lead{font-size:15px;}#rs-gate-overlay #rs-gate-input,#rs-gate-overlay #rs-gate-submit{min-height:54px;height:54px;}}',
    '@supports (-webkit-touch-callout:none){#rs-gate-overlay{height:-webkit-fill-available;min-height:-webkit-fill-available;}}',
    '@media(prefers-reduced-motion:reduce){#rs-gate-overlay,#rs-gate-overlay *,#rs-gate-overlay.is-unlocking{transition:none!important;transform:none!important;}}'
  ].join('');
  document.head.appendChild(gateStyle);

  function initGate() {
    var overlay = document.createElement('div');
    overlay.id = 'rs-gate-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'rs-gate-title');
    overlay.setAttribute('aria-describedby', 'rs-gate-lead');
    overlay.innerHTML = [
      '<div class="rs-gate-card">',
      '<div class="rs-gate-lockup">',
      '<img class="rs-gate-mark" src="assets/logos/svg/reserve-standard-monogram-tile-light.svg" alt="" width="46" height="46" decoding="async" />',
      '<div class="rs-gate-name">Reserve Standard</div>',
      '</div>',
      '<div class="rs-gate-eyebrow">Private founding release</div>',
      '<h1 class="rs-gate-title" id="rs-gate-title">Private access.</h1>',
      '<p class="rs-gate-lead" id="rs-gate-lead">Reserve Standard is in private founding release. Enter the access code shared with you to continue.</p>',
      '<form id="rs-gate-form" autocomplete="off">',
      '<label class="rs-gate-field" for="rs-gate-input">',
      '<span class="rs-gate-label">Access code</span>',
      '<input type="password" id="rs-gate-input" name="access-code" placeholder="Enter access code" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false" />',
      '</label>',
      '<button type="submit" id="rs-gate-submit">Continue</button>',
      '<p id="rs-gate-error" aria-live="polite"></p>',
      '</form>',
      '<p class="rs-gate-compliance">Educational market tool — not financial, tax, or legal advice.</p>',
      '</div>'
    ].join('');

    document.documentElement.appendChild(overlay);
    docEl.classList.add('rs-gate-locked');

    var preventGateMove = function (event) {
      event.preventDefault();
    };
    try { overlay.addEventListener('touchmove', preventGateMove, { passive: false }); } catch (e) { /* ignore */ }

    var form = document.getElementById('rs-gate-form');
    var input = document.getElementById('rs-gate-input');
    var submit = document.getElementById('rs-gate-submit');
    var errorEl = document.getElementById('rs-gate-error');

    if (input) {
      input.setAttribute('aria-invalid', 'false');
      input.setAttribute('aria-describedby', 'rs-gate-error');
      input.addEventListener('input', function () {
        input.setAttribute('aria-invalid', 'false');
        if (errorEl) errorEl.textContent = '';
      });
    }

    try {
      if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) input.focus();
    } catch (e) { /* ignore */ }

    function setBusy(isBusy) {
      if (!submit) return;
      submit.disabled = isBusy;
      submit.textContent = isBusy ? 'Verifying' : 'Continue';
    }

    function unlock() {
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
      try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }
      input.setAttribute('aria-invalid', 'false');

      var setTopOnce = function () {
        try { document.documentElement.scrollTop = 0; } catch (e) { /* ignore */ }
        try { document.body.scrollTop = 0; } catch (e) { /* ignore */ }
        try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch (e) { try { window.scrollTo(0, 0); } catch (_) {} }
      };

      setTopOnce();
      docEl.classList.remove('rs-gate-pending');
      docEl.classList.remove('rs-gate-locked');
      try { overlay.removeEventListener('touchmove', preventGateMove); } catch (e) { /* ignore */ }
      overlay.classList.add('is-unlocking');

      window.requestAnimationFrame(function () { setTopOnce(); });
      window.setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        setTopOnce();
        try { document.dispatchEvent(new CustomEvent('rs:gate-unlocked')); } catch (e) { /* ignore */ }
      }, 260);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = (input.value || '').trim();
      if (!pw) return;

      if (!window.crypto || !window.crypto.subtle) {
        errorEl.textContent = 'Your browser does not support secure access verification. Please use a modern browser.';
        return;
      }

      errorEl.textContent = '';
      setBusy(true);

      sha256(pw)
        .then(function (hash) {
          if (hash === expectedHash) {
            unlock();
          } else {
            errorEl.textContent = 'Access code not recognized.';
            input.setAttribute('aria-invalid', 'true');
            input.value = '';
            input.focus();
            setBusy(false);
          }
        })
        .catch(function () {
          errorEl.textContent = 'Verification failed. Try again.';
          input.setAttribute('aria-invalid', 'true');
          setBusy(false);
        });
    });
  }

  function sha256(text) {
    var buf = new TextEncoder().encode(text);
    return window.crypto.subtle.digest('SHA-256', buf).then(function (hash) {
      var bytes = new Uint8Array(hash);
      var hex = '';
      for (var i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    });
  }

  if (document.body) {
    initGate();
  } else {
    document.addEventListener('DOMContentLoaded', initGate);
  }
})();
