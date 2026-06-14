/*
 * Reserve Standard — Private Release Gate v172 FormSubmit login alerts
 * Lightweight private-release gate. This is not authentication.
 * Stability rule: the gate never forces scroll position after unlock.
 */
(function () {
  var docEl = document.documentElement;
  var STORAGE_KEY = 'rs_gate_unlocked';
  var STORAGE_TIME_KEY = STORAGE_KEY + '_at';
  var ATTEMPT_KEY = 'rs_gate_attempts';
  var HOLD_UNTIL_KEY = 'rs_gate_hold_until';
  var DEFAULT_MAX_AGE_DAYS = 30;
  var DEFAULT_HASH = '';
  var expectedHash = (window.RS_CONFIG && window.RS_CONFIG.gateHash) || DEFAULT_HASH;

  var config = window.RS_CONFIG || {};
  var verifier = config.gateVerifier || null;
  var ownerDeviceKey = 'rs_owner_device';
  var ownerLabelKey = 'rs_owner_label';
  var clientIdKey = 'rs_client_id';

  function randomId() {
    try {
      if (window.crypto && window.crypto.getRandomValues) {
        var bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        var out = '';
        for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
        return out;
      }
    } catch (e) { /* ignore */ }
    return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
  }

  function getClientId() {
    try {
      var existing = localStorage.getItem(clientIdKey);
      if (existing) return existing;
      var id = randomId();
      localStorage.setItem(clientIdKey, id);
      return id;
    } catch (e) { return randomId(); }
  }

  function isOwnerDevice() {
    try { return localStorage.getItem(ownerDeviceKey) === '1'; }
    catch (e) { return false; }
  }

  function ownerLabel() {
    try { return localStorage.getItem(ownerLabelKey) || config.ownerDeviceLabel || 'owner'; }
    catch (e) { return config.ownerDeviceLabel || 'owner'; }
  }

  function markOwnerFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var token = params.get('rs_owner');
      var ownerCode = params.get('rs_owner_code');
      if (!token && !ownerCode) return;

      var mark = function () {
        try {
          localStorage.setItem(ownerDeviceKey, '1');
          localStorage.setItem(ownerLabelKey, config.ownerDeviceLabel || 'owner');
        } catch (e) { /* ignore */ }
      };

      if (token === 'clear' || ownerCode === 'clear') {
        localStorage.removeItem(ownerDeviceKey);
        localStorage.removeItem(ownerLabelKey);
      } else if (ownerCode && config.ownerGateHash && window.crypto && window.crypto.subtle) {
        sha256(normalizedCode(ownerCode)).then(function (hash) {
          if (hash === config.ownerGateHash) mark();
        }).catch(function () {});
      } else if (token && config.ownerDeviceToken && token === config.ownerDeviceToken) {
        mark();
      }

      params.delete('rs_owner');
      params.delete('rs_owner_code');
      var clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
      window.history.replaceState({}, document.title, clean);
    } catch (e) { /* ignore */ }
  }

  function trackingPayload(eventName, details) {
    var clientId = getClientId();
    var owner = isOwnerDevice();
    return Object.assign({
      source: 'reserve-standard-gate',
      version: '174',
      event: eventName,
      timestamp: new Date().toISOString(),
      clientId: clientId,
      isOwner: owner,
      ownerLabel: owner ? ownerLabel() : '',
      path: window.location.pathname,
      page: document.title || '',
      referrer: document.referrer || '',
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
      viewport: String(window.innerWidth || '') + 'x' + String(window.innerHeight || ''),
      screen: (window.screen ? String(window.screen.width || '') + 'x' + String(window.screen.height || '') : ''),
      userAgent: navigator.userAgent || ''
    }, details || {});
  }

  function afterFirstPaint(fn) {
    var run = function () { try { fn(); } catch (e) { /* tracking must never affect access */ } };
    try {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(run, { timeout: 1500 });
        return;
      }
    } catch (e) { /* ignore */ }
    window.setTimeout(run, 800);
  }

  function formSubmitEndpoint() {
    var endpoint = (config.loginEmailAlertEndpoint || config.formSubmitLoginEndpoint || '').trim();
    if (!endpoint && config.loginEmailAlertEmail) endpoint = String(config.loginEmailAlertEmail).trim();
    if (!endpoint) return '';
    if (!/^https?:\/\//i.test(endpoint)) endpoint = 'https://formsubmit.co/ajax/' + endpoint;
    return endpoint;
  }

  function compactUserAgent(value) {
    value = String(value || '');
    return value.length > 260 ? value.slice(0, 260) + '…' : value;
  }

  function emailMessage(payload) {
    return [
      'Reserve Standard access was opened.',
      '',
      'Event: ' + (payload.event || ''),
      'Time: ' + (payload.timestamp || ''),
      'Owner: ' + (payload.isOwner ? 'yes' : 'no'),
      'Client ID: ' + (payload.clientId || ''),
      'Path: ' + (payload.path || ''),
      'Referrer: ' + (payload.referrer || 'direct/unknown'),
      'Viewport: ' + (payload.viewport || ''),
      'Timezone: ' + (payload.timezone || ''),
      '',
      'Access code: not sent.'
    ].join('\n');
  }

  function submitHiddenForm(endpoint, fields) {
    try {
      var host = document.body || document.documentElement;
      if (!host) return;
      var id = 'rs-login-email-' + randomId();
      var iframe = document.createElement('iframe');
      iframe.name = id;
      iframe.title = '';
      iframe.tabIndex = -1;
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'position:absolute!important;width:0!important;height:0!important;border:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;';

      var form = document.createElement('form');
      form.method = 'POST';
      form.action = endpoint.replace('/ajax/', '/');
      form.target = id;
      form.acceptCharset = 'UTF-8';
      form.setAttribute('aria-hidden', 'true');
      form.style.cssText = iframe.style.cssText;

      Object.keys(fields).forEach(function (key) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(fields[key] == null ? '' : fields[key]);
        form.appendChild(input);
      });

      host.appendChild(iframe);
      host.appendChild(form);
      form.submit();
      window.setTimeout(function () {
        try { if (form.parentNode) form.parentNode.removeChild(form); } catch (e) { /* ignore */ }
        try { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch (e) { /* ignore */ }
      }, 15000);
    } catch (e) { /* email alert must never affect access */ }
  }

  function sendFormSubmitEmail(payload) {
    if (config.loginEmailAlertsEnabled === false) return;
    if (payload.event === 'authorized_visit' && config.loginEmailAlertReturnVisits !== true) return;
    var endpoint = formSubmitEndpoint();
    if (!endpoint) return;

    afterFirstPaint(function () {
      try {
        var fields = {
          _subject: config.loginEmailAlertSubject || 'Reserve Standard access opened',
          _template: config.loginEmailAlertTemplate || 'table',
          _captcha: 'false',
          name: 'Reserve Standard access alert',
          message: emailMessage(payload),
          source: payload.source || 'reserve-standard-gate',
          version: payload.version || '',
          event: payload.event || '',
          timestamp: payload.timestamp || '',
          clientId: payload.clientId || '',
          isOwner: payload.isOwner ? 'true' : 'false',
          ownerLabel: payload.ownerLabel || '',
          method: payload.method || '',
          path: payload.path || '',
          page: payload.page || '',
          referrer: payload.referrer || '',
          timezone: payload.timezone || '',
          viewport: payload.viewport || '',
          screen: payload.screen || '',
          userAgent: compactUserAgent(payload.userAgent || ''),
          accessCodeSent: 'no'
        };
        if (config.loginEmailAlertCc) fields._cc = config.loginEmailAlertCc;

        var encoded = new URLSearchParams();
        Object.keys(fields).forEach(function (key) { encoded.set(key, fields[key]); });

        if (window.fetch) {
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'Accept': 'application/json' },
            body: encoded.toString()
          }).catch(function () { submitHiddenForm(endpoint, fields); });
          return;
        }
        submitHiddenForm(endpoint, fields);
      } catch (e) { /* email alert must never affect access */ }
    });
  }

  function sendGenericTracker(payload) {
    var endpoint = (config.loginTrackerEndpoint || '').trim();
    if (!endpoint) return;
    afterFirstPaint(function () {
      try {
        var format = String(config.loginTrackerFormat || 'form').toLowerCase();
        if (format === 'json') {
          var body = JSON.stringify(payload);
          if (navigator.sendBeacon) {
            var jsonBlob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
            if (navigator.sendBeacon(endpoint, jsonBlob)) return;
          }
          fetch(endpoint, {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: body
          }).catch(function () {});
          return;
        }

        var data = new URLSearchParams();
        Object.keys(payload).forEach(function (key) { data.set(key, String(payload[key] == null ? '' : payload[key])); });
        if (navigator.sendBeacon) {
          var formBlob = new Blob([data.toString()], { type: 'application/x-www-form-urlencoded;charset=UTF-8' });
          if (navigator.sendBeacon(endpoint, formBlob)) return;
        }
        fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',
          keepalive: true,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: data.toString()
        }).catch(function () {});
      } catch (e) { /* tracking must never affect access */ }
    });
  }

  function sendTracker(eventName, details) {
    var payload = trackingPayload(eventName, details);
    sendFormSubmitEmail(payload);
    sendGenericTracker(payload);
  }

  markOwnerFromUrl();

  function accessMaxAgeMs() {
    var days = Number(config.accessMaxAgeDays || DEFAULT_MAX_AGE_DAYS);
    if (!isFinite(days) || days <= 0) days = DEFAULT_MAX_AGE_DAYS;
    return days * 24 * 60 * 60 * 1000;
  }

  function clearStoredUnlock() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STORAGE_TIME_KEY); } catch (e) { /* ignore */ }
    try { document.cookie = STORAGE_KEY + '=; Max-Age=0; Path=/; SameSite=Lax'; } catch (e) { /* ignore */ }
  }

  function hasCookieUnlock() {
    try { return document.cookie.split(';').some(function (part) { return part.trim() === STORAGE_KEY + '=1'; }); }
    catch (e) { return false; }
  }

  function writeUnlockCookie() {
    try {
      var secure = window.location.protocol === 'https:' ? '; Secure' : '';
      var maxAge = Math.round(accessMaxAgeMs() / 1000);
      document.cookie = STORAGE_KEY + '=1; Max-Age=' + maxAge + '; Path=/; SameSite=Lax' + secure;
    } catch (e) { /* ignore */ }
  }

  function hasStoredUnlock() {
    try { if (sessionStorage.getItem(STORAGE_KEY) === '1') return true; } catch (e) { /* ignore */ }
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') {
        var unlockedAt = Number(localStorage.getItem(STORAGE_TIME_KEY) || '0');
        if (unlockedAt && (Date.now() - unlockedAt <= accessMaxAgeMs())) return true;
        clearStoredUnlock();
        return false;
      }
    } catch (e) { /* ignore */ }
    return hasCookieUnlock();
  }

  if (hasStoredUnlock()) {
    docEl.classList.add('rs-gate-unlocked');
    sendTracker('authorized_visit', { method: 'stored_unlock' });
    return;
  }

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
      '<svg class="rs-gate-mark" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 120 120">\n<rect x="8" y="8" width="104" height="104" rx="22" fill="#F4F1E8" stroke="#D7CFBF" stroke-width="1.2"/>\n<rect x="34.2" y="26.0" width="13.2" height="66.0" rx="4.7" fill="#061328"/>\n<rect x="34.2" y="26.0" width="38.0" height="13.0" rx="4.7" fill="#061328"/>\n<rect x="60.0" y="26.0" width="12.2" height="24.0" rx="4.7" fill="#061328"/>\n<polygon points="54.0,58.0 68.4,58.0 87.0,92.0 72.8,92.0" fill="#061328"/>\n<rect x="38.0" y="23.3" width="6.6" height="31.7" rx="3.3" fill="#F4F1E8"/>\n</svg>',
      '<div class="rs-gate-name">Reserve Standard</div>',
      '</div>',
      '<div class="rs-gate-eyebrow">Private access</div>',
      '<h1 class="rs-gate-title" id="rs-gate-title">Private access.</h1>',
      '<p class="rs-gate-lead" id="rs-gate-lead">Reserve Standard is in private access. Enter the access code shared with you to continue.</p>',
      '<form id="rs-gate-form" autocomplete="off">',
      '<label class="rs-gate-field" for="rs-gate-input">',
      '<span class="rs-gate-label">Access code</span>',
      '<input type="password" id="rs-gate-input" name="access-code" placeholder="Enter access code" autocomplete="one-time-code" inputmode="text" autocapitalize="characters" autocorrect="off" spellcheck="false" />',
      '</label>',
      '<button type="submit" id="rs-gate-submit">Continue</button>',
      '<p id="rs-gate-error" aria-live="polite"></p>',
      '</form>',
      '<p class="rs-gate-compliance">Educational treasury material — not financial, tax, or legal advice.</p>',
      '</div>'
    ].join('');

    document.documentElement.appendChild(overlay);
    docEl.classList.add('rs-gate-locked');

    var preventGateMove = function (event) { event.preventDefault(); };
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
      try { if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) input.focus(); } catch (e) { /* ignore */ }
    }

    function clearAttemptState() {
      try { localStorage.removeItem(ATTEMPT_KEY); localStorage.removeItem(HOLD_UNTIL_KEY); } catch (e) { /* ignore */ }
    }

    function holdSecondsRemaining() {
      try {
        var until = Number(localStorage.getItem(HOLD_UNTIL_KEY) || '0');
        if (until > Date.now()) return Math.ceil((until - Date.now()) / 1000);
      } catch (e) { /* ignore */ }
      return 0;
    }

    function recordFailedAttempt() {
      try {
        var count = Number(localStorage.getItem(ATTEMPT_KEY) || '0') + 1;
        localStorage.setItem(ATTEMPT_KEY, String(count));
        var delay = 0;
        if (count >= 9) delay = 300;
        else if (count >= 6) delay = 60;
        else if (count >= 4) delay = 15;
        if (delay) localStorage.setItem(HOLD_UNTIL_KEY, String(Date.now() + delay * 1000));
        return delay;
      } catch (e) { return 0; }
    }

    function setBusy(isBusy) {
      if (!submit) return;
      submit.disabled = isBusy;
      submit.textContent = isBusy ? 'Verifying' : 'Continue';
    }

    function unlock(method) {
      if (method === 'owner_code') {
        try { localStorage.setItem(ownerDeviceKey, '1'); localStorage.setItem(ownerLabelKey, config.ownerDeviceLabel || 'owner'); } catch (e) { /* ignore */ }
      }
      clearAttemptState();
      sendTracker('gate_unlock', { method: method || 'access_code' });
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
      try { localStorage.setItem(STORAGE_KEY, '1'); localStorage.setItem(STORAGE_TIME_KEY, String(Date.now())); } catch (e) { /* ignore */ }
      writeUnlockCookie();
      if (input) input.setAttribute('aria-invalid', 'false');
      docEl.classList.remove('rs-gate-pending');
      docEl.classList.remove('rs-gate-locked');
      docEl.classList.add('rs-gate-unlocked');
      try { overlay.removeEventListener('touchmove', preventGateMove); } catch (e) { /* ignore */ }
      overlay.classList.add('is-unlocking');
      window.setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        window.requestAnimationFrame(function () {
          try { document.dispatchEvent(new CustomEvent('rs:gate-unlocked')); } catch (e) { /* ignore */ }
        });
      }, 220);
    }

    function normalizedCode(value) {
      return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/[^A-Z0-9]/g, '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var held = holdSecondsRemaining();
      if (held > 0) {
        errorEl.textContent = 'Too many attempts. Try again in ' + held + ' seconds.';
        return;
      }

      var pw = normalizedCode(input.value || '');
      if (!pw) return;
      if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
        errorEl.textContent = 'This browser cannot verify the access code. Please use a modern browser.';
        return;
      }
      errorEl.textContent = '';
      setBusy(true);
      verifySubmittedCode(pw).then(function (result) {
        if (result === 'owner_code') {
          clearAttemptState();
          unlock('owner_code');
        } else if (result === 'access_code') {
          clearAttemptState();
          unlock('access_code');
        } else {
          var delay = recordFailedAttempt();
          errorEl.textContent = delay ? 'Too many attempts. Try again in ' + delay + ' seconds.' : 'Access code not recognized.';
          input.setAttribute('aria-invalid', 'true');
          input.value = '';
          try { input.focus(); } catch (e) { /* ignore */ }
          setBusy(false);
        }
      }).catch(function () {
        errorEl.textContent = 'Verification failed. Try again.';
        input.setAttribute('aria-invalid', 'true');
        setBusy(false);
      });
    });
  }

  function verifySubmittedCode(code) {
    return sha256(code).then(function (hash) {
      if (config.ownerGateHash && constantTimeEqual(hash, config.ownerGateHash)) return 'owner_code';
      if (verifier && String(verifier.algorithm || '').toUpperCase() === 'PBKDF2-SHA256') {
        return pbkdf2Hex(code, verifier.salt, Number(verifier.iterations || 250000)).then(function (derived) {
          return constantTimeEqual(derived, String(verifier.hash || '')) ? 'access_code' : '';
        });
      }
      return expectedHash && constantTimeEqual(hash, expectedHash) ? 'access_code' : '';
    });
  }

  function constantTimeEqual(a, b) {
    a = String(a || '');
    b = String(b || '');
    var mismatch = a.length ^ b.length;
    var len = Math.max(a.length, b.length);
    for (var i = 0; i < len; i++) {
      mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return mismatch === 0;
  }

  function base64ToBytes(value) {
    var raw = window.atob(String(value || ''));
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  function bytesToHex(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
    return hex;
  }

  function pbkdf2Hex(text, saltB64, iterations) {
    var encoder = new TextEncoder();
    return window.crypto.subtle.importKey('raw', encoder.encode(text), 'PBKDF2', false, ['deriveBits']).then(function (key) {
      return window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: base64ToBytes(saltB64), iterations: iterations, hash: 'SHA-256' }, key, 256);
    }).then(function (bits) { return bytesToHex(new Uint8Array(bits)); });
  }

  function sha256(text) {
    var buf = new TextEncoder().encode(text);
    return window.crypto.subtle.digest('SHA-256', buf).then(function (hash) {
      var bytes = new Uint8Array(hash);
      var hex = '';
      for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
      return hex;
    });
  }

  if (document.body) initGate();
  else document.addEventListener('DOMContentLoaded', initGate);
})();
