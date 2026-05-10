(function(){
  const cfg = window.RS_CONFIG || {};
  const email = cfg.accessEmail || 'access@reservestandard.com';
  const form = document.getElementById('founding-access-form');
  const status = document.getElementById('form-status');
  const emailEls = document.querySelectorAll('[data-access-email]');
  emailEls.forEach(el => { el.textContent = email; if(el.tagName === 'A') el.href = 'mailto:' + email; });
  if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const data = new FormData(form);
    const obj = Object.fromEntries(data.entries());
    const endpoint = (cfg.formEndpoint || '').trim();
    if(endpoint){
      try{
        const res = await fetch(endpoint, { method:'POST', body:data });
        if(!res.ok) throw new Error('Form endpoint failed');
        status.textContent = 'Request received. Reserve Standard will review access manually.';
        form.reset();
        return;
      }catch(err){
        status.textContent = 'The web form did not submit. Opening email instead.';
      }
    }
    const subject = encodeURIComponent('Reserve Standard founding access request');
    const body = encodeURIComponent(
      'Name: ' + (obj.name || '') + '\n' +
      'Business: ' + (obj.business || '') + '\n' +
      'City / state: ' + (obj.location || '') + '\n' +
      'Email: ' + (obj.email || '') + '\n' +
      'Phone: ' + (obj.phone || '') + '\n' +
      'TradingView username: ' + (obj.tradingview || '') + '\n' +
      'Weekly reserve amount to test: ' + (obj.weekly || '') + '\n' +
      'Business currently holds BTC: ' + (obj.holds_btc || '') + '\n' +
      'Can review weekly for 90 days: ' + (obj.weekly_review || '') + '\n' +
      'Anonymized usage allowed: ' + (obj.anonymous || '') + '\n' +
      'What would make this useful: ' + (obj.feedback || '') + '\n'
    );
    window.location.href = 'mailto:' + email + '?subject=' + subject + '&body=' + body;
  });
})();
