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
      const subject = 'Advisor/professional review — A Right For All';
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
          if(role === 'Funding / resource strategy'){
            note.value = 'I can help pressure-test the sustainable funding/resource model while preserving free access for incarcerated users.';
          }else if(role === 'Corrections / operations'){
            note.value = 'I can help with facility reality, corrections operations, or the tablet environment.';
          }
        }
      });
    });
  }

  function setupRevealTargets(){
    const selectors = [
      '.section-head', '.compact-section-head', '.page-hero .eyebrow', '.page-hero h1', '.page-lead', '.support-line', '.cta-row', '.cta-row .btn',
      '.card', '.letter-card', '.archive-card', '.minimum-card', '.path-card', '.support-card', '.source-card', '.compare-card', '.proof-card',
      '.panel', '.voice-card', '.room-card', '.hero-side .thesis-card', '.hero-side .photo-card', '.hero-copy', '.letter-collage', '.letters-showcase', '.letter-intro-row',
      '.evidence-pill', '.minimum-band', '.logic-band', '.logic-pill', '.immersive-quote', '.builders-note', '.callout', '.challenge-shell', '.challenge-copy', '.challenge-side', '.challenge-card', '.challenge-points li',
      '.thesis-list li', '.compare-list li', '.source-bullets li', '.evidence-chip', '.archive-actions a', '.letter-actions a', '.join', '.join-step', '.form-shell'
    ].join(', ');
    document.querySelectorAll(selectors).forEach(function(el){
      if(el.closest('.site-header') || el.closest('.site-footer') || el.closest('form')) return;
      if(!el.classList.contains('reveal')) el.classList.add('reveal');
    });
  }

  function setupRevealChoreography(){
    const all = Array.from(document.querySelectorAll('.reveal'));
    all.forEach(function(el){
      el.style.setProperty('--reveal-delay','0ms');
      if(el.matches('.hero-copy, .room-copy, .challenge-copy, .letter-intro-row')) el.classList.add('reveal-left');
      if(el.matches('.hero-side, .photo-card, .letter-collage, .challenge-side, .letters-showcase')) el.classList.add('reveal-right');
      if(el.matches('.section-head, .compact-section-head, .page-hero h1, .page-lead, .support-line, .immersive-quote')) el.classList.add('reveal-soft');
      if(el.matches('.btn, .cta-row, .evidence-pill, .evidence-chip, .logic-pill')) el.classList.add('reveal-pop');
      if(el.matches('.photo-card, .letter-collage, .archive-card')) el.classList.add('reveal-clip');
      if(el.matches('.compare-card:nth-child(odd), .voice-card:nth-child(odd), .room-card:nth-child(odd)')) el.classList.add('reveal-tilt-left');
      if(el.matches('.compare-card:nth-child(even), .voice-card:nth-child(even), .room-card:nth-child(even)')) el.classList.add('reveal-tilt-right');
    });

    const groupSelectors = [
      '.proof-grid', '.support-grid', '.minimum-grid', '.path-grid', '.letter-grid', '.archive-grid', '.sources-grid', '.evidence-grid',
      '.builders-grid', '.public-record-grid', '.vision-grid', '.three-col', '.two-col', '.room-grid', '.compare-grid', '.logic-band', '.hero-truths', '.evidence-strip', '.thesis-list', '.compare-list', '.source-bullets', '.evidence-meta-line', '.challenge-points', '.join-steps'
    ];
    groupSelectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(group){
        Array.from(group.children).forEach(function(child, index){
          if(!child.classList || !child.classList.contains('reveal')) return;
          child.style.setProperty('--reveal-delay', Math.min(index, 8) * 62 + 'ms');
          child.classList.add(index % 2 === 0 ? 'reveal-left' : 'reveal-right');
          if(index > 2) child.classList.add('reveal-rise');
        });
      });
    });

    document.querySelectorAll('.hero-grid').forEach(function(group){
      Array.from(group.children).forEach(function(child, index){
        if(child.classList && child.classList.contains('reveal')) child.style.setProperty('--reveal-delay', index * 120 + 'ms');
      });
    });

    document.querySelectorAll('.challenge-shell').forEach(function(group){
      const left = group.querySelector('.challenge-copy');
      const right = group.querySelector('.challenge-side, .challenge-card');
      if(left && left.classList.contains('reveal')) left.style.setProperty('--reveal-delay','0ms');
      if(right && right.classList.contains('reveal')) right.style.setProperty('--reveal-delay','180ms');
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
  setupRevealTargets();
  setupRevealChoreography();
  setupPrefillButtons();
  setupReveal();
  setupProgress();
  setupActiveNav();
})();
