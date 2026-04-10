(function(){
  function setupJoinForm(){
    const form=document.getElementById('joinForm');
    if(!form) return;
    const emailTarget=(form.getAttribute('data-email')||'hello@arightforall.com').trim();
    const help=form.querySelector('.form-help');
    form.addEventListener('submit',function(e){
      e.preventDefault();
      const fd=new FormData(form);
      const name=(fd.get('name')||'').toString().trim();
      const email=(fd.get('email')||'').toString().trim();
      const role=(fd.get('role')||'').toString().trim();
      const note=(fd.get('note')||'').toString().trim();
      const subject='Join the movement — A Right For All';
      const body=[
        'Name: '+(name||'—'),
        'Email: '+(email||'—'),
        'Role / lane: '+(role||'—'),
        '',
        'How I can help:',
        note||'—'
      ].join('
');
      const mailto='mailto:'+encodeURIComponent(emailTarget)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
      window.location.href=mailto;
      if(help){
        help.innerHTML='Your email draft should open now. If it does not, email <a href="mailto:'+emailTarget+'">'+emailTarget+'</a> directly.';
      }
    });
  }
  function setupPrefillButtons(){
    document.querySelectorAll('[data-prefill-role]').forEach(function(btn){
      btn.addEventListener('click', function(){
        const role=btn.getAttribute('data-prefill-role');
        const select=document.getElementById('role');
        if(select && role){ select.value=role; }
      });
    });
  }
  setupJoinForm();
  setupPrefillButtons();
})();