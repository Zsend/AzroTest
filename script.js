// AZRO Systems — Minimal, stable JS
// Designed to be non-blocking and never interfere with navigation.
// - Copy-to-clipboard buttons
// - Mobile menu UX (details element): scroll lock + overlay close + Escape

(function(){
  function copyText(text){
    if(!text) return Promise.reject(new Error('No text'));
    if(navigator.clipboard && window.isSecureContext){
      return navigator.clipboard.writeText(text);
    }
    // Fallback (older browsers / non-secure contexts)
    return new Promise(function(resolve, reject){
      try{
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly','');
        ta.style.position='fixed';
        ta.style.left='-9999px';
        ta.style.top='0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('execCommand failed'));
      }catch(e){ reject(e); }
    });
  }

  function initCopyButtons(){
    var btns = document.querySelectorAll('[data-copy]');
    if(!btns.length) return;

    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var text = btn.getAttribute('data-copy-text');
        var targetId = btn.getAttribute('data-copy-target');
        if(!text && targetId){
          var el = document.getElementById(targetId);
          if(el) text = (el.textContent || '').trim();
        }
        var original = btn.textContent;
        copyText((text || '').trim())
          .then(function(){
            btn.textContent = 'Copied';
            btn.setAttribute('aria-live','polite');
            setTimeout(function(){ btn.textContent = original; }, 1200);
          })
          .catch(function(){
            btn.textContent = 'Copy failed';
            setTimeout(function(){ btn.textContent = original; }, 1400);
          });
      }, {passive:true});
    });
  }

  function initMobileMenu(){
    var menu = document.querySelector('details.menu');
    if(!menu) return;

    var summary = menu.querySelector('summary');
    var panel = menu.querySelector('.menu-panel');

    function sync(){
      var open = menu.hasAttribute('open');
      document.body.classList.toggle('menu-open', open);
      if(summary){
        summary.setAttribute('aria-expanded', open ? 'true' : 'false');
        summary.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      }
    }

    menu.addEventListener('toggle', sync);

    // Close when tapping the overlay background
    if(panel){
      panel.addEventListener('click', function(e){
        if(e.target === panel){
          menu.removeAttribute('open');
          sync();
          if(summary) summary.focus();
        }
      });
    }

    // Close on Escape
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && menu.hasAttribute('open')){
        menu.removeAttribute('open');
        sync();
        if(summary) summary.focus();
      }
    });

    // Ensure correct initial state
    sync();
  }

  function init(){
    initCopyButtons();
    initMobileMenu();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  }else{
    init();
  }
})();
