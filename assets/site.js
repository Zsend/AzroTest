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
        const note = document.getElementById('note');
        if(note && !note.value.trim()){
          if(role === 'Donor / sponsor'){
            note.value = 'I would like to discuss founding support for the first phase.';
          }else if(role === 'Corrections / operations'){
            note.value = 'I can help with facility reality, corrections operations, or the tablet environment.';
          }
        }
      });
    });
  }

  function setupReveal(){
    const items = document.querySelectorAll('.reveal');
    if(!items.length) return;

    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      items.forEach(function(el){ el.classList.add('is-visible'); });
      return;
    }

    const io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold: 0.14, rootMargin: '0px 0px -40px 0px'});

    items.forEach(function(el){ io.observe(el); });
  }

  function setupProgress(){
    const onScroll = function(){
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      doc.style.setProperty('--progress', pct.toFixed(2) + '%');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
  }

  function setupActiveNav(){
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    if(!links.length) return;

    const map = new Map();
    links.forEach(function(link){
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if(target){
        target.setAttribute('data-section', '');
        map.set(target, link);
      }
    });

    const clear = function(){
      links.forEach(function(link){ link.classList.remove('is-active'); });
    };

    const observer = new IntersectionObserver(function(entries){
      const visible = entries
        .filter(function(entry){ return entry.isIntersecting; })
        .sort(function(a,b){ return b.intersectionRatio - a.intersectionRatio; })[0];

      if(visible){
        clear();
        const link = map.get(visible.target);
        if(link) link.classList.add('is-active');
      }
    }, {rootMargin: '-20% 0px -60% 0px', threshold:[0.2,0.4,0.6]});

    map.forEach(function(_, section){ observer.observe(section); });
  }

  setupJoinForm();
  setupPrefillButtons();
  setupReveal();
  setupProgress();
  setupActiveNav();
})();
