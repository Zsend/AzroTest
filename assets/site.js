
(function(){
  function setupJoinForm(){
    const form = document.getElementById('joinForm');
    if(!form) return;
    const emailTarget = (form.getAttribute('data-email') || 'hello@arightforall.com').trim();
    const help = form.querySelector('.form-help');

    form.addEventListener('submit', function(e){
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const role = String(fd.get('role') || '').trim();
      const note = String(fd.get('note') || '').trim();
      const subject = 'Join the movement — A Right For All';
      const body = [
        'Name: ' + (name || '—'),
        'Email: ' + (email || '—'),
        'Role / lane: ' + (role || '—'),
        '',
        'How I can help:',
        note || '—'
      ].join('\n');

      const mailto = 'mailto:' + encodeURIComponent(emailTarget) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.location.href = mailto;

      if(help){
        help.innerHTML = 'Your email draft should open now. If it does not, email <a href="mailto:' + emailTarget + '">' + emailTarget + '</a> directly.';
      }
    });
  }

  function setupPrefillButtons(){
    document.querySelectorAll('[data-prefill-role]').forEach(function(btn){
      btn.addEventListener('click', function(){
        const role = btn.getAttribute('data-prefill-role');
        const select = document.getElementById('role');
        if(select && role){
          select.value = role;
        }
      });
    });
  }

  function setupScrollProgress(){
    const bar = document.querySelector('.reading-progress span');
    if(!bar) return;
    const update = function(){
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
    };
    update();
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
  }

  function setupActiveNav(){
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    if(!links.length) return;
    const map = new Map();
    links.forEach(function(link){
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      if(section) map.set(section, link);
    });
    if(!map.size) return;
    const observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        const link = map.get(entry.target);
        if(!link) return;
        if(entry.isIntersecting){
          links.forEach(function(other){ other.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, {rootMargin:'-35% 0px -55% 0px', threshold:0});
    map.forEach(function(_, section){ observer.observe(section); });
  }

  setupJoinForm();
  setupPrefillButtons();
  setupScrollProgress();
  setupActiveNav();
})();
