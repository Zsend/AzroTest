(function(){
  const cfg = window.RESERVE_STANDARD_CONFIG || {};
  const year = document.querySelector('[data-year]');
  if(year) year.textContent = cfg.currentYear || new Date().getFullYear();

  document.querySelectorAll('[data-access-email]').forEach(el => {
    el.textContent = cfg.accessEmail || 'access@reservestandard.com';
    if(el.tagName === 'A') el.href = 'mailto:' + (cfg.accessEmail || 'access@reservestandard.com');
  });

  const form = document.querySelector('#founding-access-form');
  if(!form) return;
  const status = document.querySelector('#form-status');
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    const endpoint = cfg.formEndpoint || '';
    if(endpoint && !endpoint.includes('REPLACE_')){
      try{
        const res = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
        if(res.ok){
          if(status) status.textContent = 'Request received. Reserve Standard will reply directly.';
          form.reset();
          return;
        }
      }catch(err){}
    }
    const email = cfg.accessEmail || 'access@reservestandard.com';
    const subject = encodeURIComponent('Reserve Standard founding access request');
    const body = encodeURIComponent([
      'Name: ' + (payload.name || ''),
      'Business: ' + (payload.business || ''),
      'City / state: ' + (payload.location || ''),
      'Email: ' + (payload.email || ''),
      'Phone: ' + (payload.phone || ''),
      'TradingView username: ' + (payload.tradingview || ''),
      'Weekly reserve amount to test: ' + (payload.weekly || ''),
      'Business currently holds BTC: ' + (payload.holds_btc || ''),
      'Can review weekly for 90 days: ' + (payload.weekly_review || ''),
      'Anonymized usage allowed: ' + (payload.anonymous || ''),
      'Feedback: ' + (payload.feedback || ''),
    ].join('\n'));
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    if(status) status.textContent = 'Opening your email client. If it does not open, email ' + email + '.';
  });
})();
