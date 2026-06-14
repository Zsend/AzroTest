/* Reserve Standard — contact modal (v200) */
(function () {
  var overlay = document.getElementById('rs-contact');
  if (!overlay) return;
  var lastFocus = null;
  function open(e) { if (e) e.preventDefault(); lastFocus = document.activeElement; overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false'); document.documentElement.style.overflow = 'hidden'; var c = overlay.querySelector('[data-close-contact]'); if (c) c.focus(); }
  function close() { overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden', 'true'); document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  var op = document.querySelectorAll('[data-open-contact]'); for (var i=0;i<op.length;i++) op[i].addEventListener('click', open);
  var cl = overlay.querySelectorAll('[data-close-contact]'); for (var j=0;j<cl.length;j++) cl[j].addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.keyCode === 27) && overlay.classList.contains('is-open')) close(); });
  var cb = overlay.querySelector('[data-copy-email]');
  if (cb) cb.addEventListener('click', function () { var d=function(){ cb.textContent='Copied'; cb.classList.add('is-copied'); setTimeout(function(){ cb.textContent='Copy'; cb.classList.remove('is-copied'); },1600); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('support@reservestandard.com').then(d).catch(d); else d(); });
})();
