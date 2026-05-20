/*
 * Reserve Standard — Stealth Gate v1
 *
 * Self-contained access gate for stealth-mode founding-cohort release.
 * Loaded synchronously in <head> BEFORE script.js so it runs first and
 * prevents content flash before the gate decides.
 *
 * Threat model: blocks search engines (via noindex meta + robots.txt)
 * and casual visitors who don't have the access code. NOT a real auth
 * system — anyone with DevTools can bypass. Use a strong access code.
 *
 * Per Brand Canon v1.0 §07 — stealth posture until founding cohort scales.
 * Educational market tool — not financial, tax, or legal advice.
 */
(function () {
  // Hide page body immediately to prevent content flash before gate decision.
  // CSS injected into <head> as soon as this script parses.
  var pendingStyle = document.createElement('style');
  pendingStyle.id = 'rs-gate-pending-style';
  pendingStyle.textContent =
    'html.rs-gate-pending body{visibility:hidden!important;}';
  document.head.appendChild(pendingStyle);
  document.documentElement.classList.add('rs-gate-pending');

  var STORAGE_KEY = 'rs_gate_unlocked';
  var DEFAULT_HASH =
    'REPLACE_THIS_WITH_REAL_PASSWORD_HASH_BEFORE_DEPLOY';

  // Read hash from site-config.js if present, else fall back to the
  // placeholder. This lets the access code be rotated via site-config.js
  // without editing gate.js itself.
  var expectedHash =
    (window.RS_CONFIG && window.RS_CONFIG.gateHash) || DEFAULT_HASH;

  // If already unlocked this session, reveal immediately and exit.
  if (
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem(STORAGE_KEY) === '1'
  ) {
    document.documentElement.classList.remove('rs-gate-pending');
    return;
  }

  // Inject overlay styles. Brand-canon palette: Navy #061328, Bone #F4F1E8,
  // Reserve green #0A8A7B, Slate #7A8BA6, Slate-light #A2AFC2.
  var gateStyle = document.createElement('style');
  gateStyle.id = 'rs-gate-style';
  gateStyle.textContent = [
    '#rs-gate-overlay{position:fixed;inset:0;z-index:2147483647;',
    'background:#061328;color:#F4F1E8;display:flex;align-items:center;',
    'justify-content:center;font-family:Inter,system-ui,-apple-system,',
    '"Helvetica Neue",sans-serif;visibility:visible!important;}',
    '#rs-gate-overlay .rs-gate-inner{max-width:480px;width:90%;',
    'padding:48px 24px;text-align:center;box-sizing:border-box;}',
    '#rs-gate-overlay .rs-gate-eyebrow{font-size:11px;letter-spacing:3px;',
    'text-transform:uppercase;color:#7A8BA6;margin-bottom:24px;',
    'font-weight:500;}',
    '#rs-gate-overlay .rs-gate-title{font-family:Georgia,"Times New Roman",',
    'serif;font-size:32px;font-weight:600;margin:0 0 16px;',
    'letter-spacing:-0.02em;line-height:1.15;}',
    '#rs-gate-overlay .rs-gate-lead{color:#A2AFC2;margin:0 0 32px;',
    'line-height:1.6;font-size:15px;}',
    '#rs-gate-overlay #rs-gate-form{margin:0;}',
    '#rs-gate-overlay #rs-gate-input{width:100%;padding:14px 16px;',
    'border:1px solid #7A8BA6;background:transparent;color:#F4F1E8;',
    'font-size:16px;border-radius:4px;margin:0 0 12px;box-sizing:border-box;',
    'font-family:inherit;outline:none;transition:border-color .2s;}',
    '#rs-gate-overlay #rs-gate-input:focus{border-color:#0A8A7B;}',
    '#rs-gate-overlay #rs-gate-input::placeholder{color:#7A8BA6;}',
    '#rs-gate-overlay #rs-gate-submit{width:100%;padding:14px 16px;',
    'background:#0A8A7B;color:#fff;border:none;font-size:15px;font-weight:600;',
    'border-radius:4px;cursor:pointer;font-family:inherit;letter-spacing:.02em;',
    'transition:background .2s;}',
    '#rs-gate-overlay #rs-gate-submit:hover{background:#0c9c8c;}',
    '#rs-gate-overlay #rs-gate-error{color:#ff8a8a;margin:16px 0 0;',
    'font-size:13px;min-height:18px;font-weight:500;}',
    '#rs-gate-overlay .rs-gate-compliance{color:#7A8BA6;font-size:11px;',
    'margin:40px 0 0;letter-spacing:.5px;}'
  ].join('');
  document.head.appendChild(gateStyle);

  function initGate() {
    // Build overlay
    var overlay = document.createElement('div');
    overlay.id = 'rs-gate-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Private access');
    overlay.innerHTML = [
      '<div class="rs-gate-inner">',
      '<div class="rs-gate-eyebrow">Reserve Standard</div>',
      '<div class="rs-gate-title">Private access.</div>',
      '<p class="rs-gate-lead">Reserve Standard is in private ',
      'founding release. Enter the access code shared with you ',
      'to continue.</p>',
      '<form id="rs-gate-form" autocomplete="off">',
      '<input type="password" id="rs-gate-input" placeholder="Access code" ',
      'autocomplete="off" autocapitalize="off" autocorrect="off" ',
      'spellcheck="false" aria-label="Access code" />',
      '<button type="submit" id="rs-gate-submit">Continue</button>',
      '<p id="rs-gate-error" aria-live="polite"></p>',
      '</form>',
      '</div>'
    ].join('');

    // Append to documentElement (not body) so body{visibility:hidden}
    // doesn't hide the overlay itself.
    document.documentElement.appendChild(overlay);

    var form = document.getElementById('rs-gate-form');
    var input = document.getElementById('rs-gate-input');
    var errorEl = document.getElementById('rs-gate-error');

    // Focus the input
    try { input.focus(); } catch (e) { /* ignore */ }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = (input.value || '').trim();
      if (!pw) return;

      if (!window.crypto || !window.crypto.subtle) {
        errorEl.textContent =
          'Your browser does not support secure access verification. ' +
          'Please use a modern browser (Chrome, Safari, Firefox, Edge).';
        return;
      }

      sha256(pw)
        .then(function (hash) {
          if (hash === expectedHash) {
            try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
            // Reveal site content + remove overlay
            document.documentElement.classList.remove('rs-gate-pending');
            overlay.parentNode.removeChild(overlay);
          } else {
            errorEl.textContent = 'Access code not recognized.';
            input.value = '';
            input.focus();
          }
        })
        .catch(function () {
          errorEl.textContent = 'Verification failed. Try again.';
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

  // Initialize when body exists
  if (document.body) {
    initGate();
  } else {
    document.addEventListener('DOMContentLoaded', initGate);
  }
})();
