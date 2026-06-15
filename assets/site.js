(function(){
  'use strict';
  document.documentElement.classList.add('js');

  function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
  function setDelay(el, ms){ if(el) el.style.setProperty('--reveal-delay', ms + 'ms'); }

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
      const subject = 'Advisor/professional input — A Right For All';
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
      if(help){ help.innerHTML = 'Your email draft should open now. If it does not, email <a href="mailto:' + emailTarget + '">' + emailTarget + '</a> directly.'; }
    });
  }

  function setupPrefillButtons(){
    qsa('[data-prefill-role]').forEach(function(btn){
      btn.addEventListener('click', function(){
        const role = btn.getAttribute('data-prefill-role');
        const select = document.getElementById('role');
        if(select && role) select.value = role;
        const note = document.getElementById('note');
        if(note && !note.value.trim()){
          if(role === 'Funding / resource strategy') note.value = 'I can help pressure-test the sustainable funding/resource model while preserving free access for incarcerated users.';
          else if(role === 'Corrections / operations') note.value = 'I can help with facility reality, corrections operations, or the tablet environment.';
        }
      });
    });
  }

  function setupProgress(){
    const onScroll = function(){
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
      doc.style.setProperty('--progress', ((window.scrollY / max) * 100).toFixed(2) + '%');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
  }

  function setupActiveNav(){
    const links = qsa('.nav-links a[href^="#"]');
    if(!links.length) return;
    const map = new Map();
    links.forEach(function(link){
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if(target){ target.setAttribute('data-section',''); map.set(target, link); }
    });
    const observer = new IntersectionObserver(function(entries){
      const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible) return;
      links.forEach(link => link.classList.remove('is-active'));
      const link = map.get(visible.target);
      if(link) link.classList.add('is-active');
    }, {rootMargin:'-22% 0px -58% 0px', threshold:[0.2,0.4,0.6]});
    map.forEach(function(_, section){ observer.observe(section); });
  }

  function addRevealTargets(){
    const selectors = [
      '.hero .eyebrow', '.hero h1', '.hero h2', '.hero .lead', '.hero .support-line', '.hero-truths span', '.hero .cta-row .btn', '.hero-proof .proof-card', '.hero-side .photo-card', '.hero-side .thesis-card', '.hero-photo-frame', '.hero-photo-caption', '.evidence-footer',
      '.section-head', '.compact-section-head', '.page-hero .eyebrow', '.page-hero .section-label', '.page-hero h1', '.page-lead', '.page-hero .cta-row .btn',
      '.room-copy', '.room-card', '.immersive-quote', '.compare-card', '.logic-band', '.logic-pill', '.declaration-card', '.callout', '.minimum-band',
      '.letter-intro-row', '.letter-collage', '.letters-showcase', '.evidence-pill', '.voice-card', '.letter-card', '.archive-card', '.source-card', '.source-bullets li',
      '.minimum-card', '.path-card', '.support-card', '.card', '.proof-card', '.panel.copy-panel', '.thesis-card', '.photo-card', '.national-hero .hero-side',
      '.join', '.join .section-label', '.join h2', '.join p', '.join-step', '.join .side-card', '.join .side-actions .btn', '.form-shell',
      '.challenge-section', '.challenge-shell', '.challenge-copy', '.challenge-side', '.challenge-card', '.challenge-mini'
    ].join(', ');
    qsa(selectors).forEach(function(el){
      if(el.closest('.site-header') || el.closest('.site-footer')) return;
      if(!el.classList.contains('reveal')) el.classList.add('reveal');
    });
  }

  function setKinds(){
    qsa('.reveal').forEach(function(el){
      if(el.matches('.hero-copy,.room-copy,.letter-intro-row,.challenge-copy,.join')) el.classList.add('reveal-left');
      if(el.matches('.hero-side,.hero-side .photo-card,.letter-collage,.letters-showcase,.challenge-side,.national-hero .hero-side')) el.classList.add('reveal-right');
      if(el.matches('.section-head,.compact-section-head,.page-hero h1,.page-lead,.support-line,.callout,.declaration-card,.immersive-quote,.minimum-band')) el.classList.add('reveal-soft');
      if(el.matches('.btn,.hero-truths span,.evidence-pill,.evidence-chip,.logic-pill,.challenge-mini,.join-step')) el.classList.add('reveal-pop');
      if(el.matches('.photo-card,.hero-photo-frame,.letter-collage,.letters-showcase,.archive-card')) el.classList.add('reveal-clip');
      if(el.matches('.room-card,.compare-card,.minimum-card,.path-card,.source-card,.support-card,.proof-card,.voice-card,.letter-card,.card')) el.classList.add('reveal-rise');
    });

    function stagger(groupSel, childSel, step, base){
      qsa(groupSel).forEach(function(group){
        qsa(childSel || ':scope > *', group).forEach(function(el, i){
          if(el.classList && !el.classList.contains('reveal')) el.classList.add('reveal');
          if(el.classList){
            if(!el.classList.contains('reveal-left') && !el.classList.contains('reveal-right')) el.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
            setDelay(el, (base||0) + Math.min(i, 12) * (step||76));
          }
        });
      });
    }

    qsa('.hero').forEach(function(hero){
      let n = 0;
      ['.eyebrow','h1','h2','.lead','.support-line','.hero-truths span','.cta-row .btn','.hero-proof .proof-card','.hero-side .photo-card','.hero-photo-frame','.hero-photo-caption','.evidence-footer','.hero-side .thesis-card'].forEach(function(sel){
        qsa(sel, hero).forEach(function(el){
          if(!el.classList.contains('reveal')) el.classList.add('reveal');
          if(el.closest('.hero-side')) el.classList.add('reveal-right');
          else if(el.matches('.hero-truths span,.cta-row .btn,.proof-card')) el.classList.add('reveal-pop');
          else el.classList.add('reveal-left');
          setDelay(el, Math.min(n, 18) * 82);
          n++;
        });
      });
    });

    qsa('.room-section').forEach(function(section){
      let n=0;
      ['.room-copy','.room-card','.immersive-quote'].forEach(function(sel){
        qsa(sel, section).forEach(function(el){
          if(!el.classList.contains('reveal')) el.classList.add('reveal');
          el.classList.add(sel === '.room-copy' ? 'reveal-left' : 'reveal-right');
          setDelay(el, Math.min(n,12)*98); n++;
        });
      });
    });

    ['.proof-grid','.support-grid','.minimum-grid','.path-grid','.letter-grid','.archive-grid','.sources-grid','.evidence-grid','.builders-grid','.public-record-grid','.vision-grid','.three-col','.two-col','.compare-grid','.logic-band','.hero-truths','.evidence-strip','.thesis-list','.compare-list','.source-bullets','.evidence-meta-line','.join-steps','.challenge-mini-grid'].forEach(function(sel){
      stagger(sel, ':scope > *', 74, 0);
    });

    qsa('.join').forEach(function(join){
      let n = 0;
      ['.section-label','h2','p','.join-step','.form-shell','.side-card','.side-actions .btn'].forEach(function(sel){
        qsa(sel, join).forEach(function(el){
          if(!el.classList.contains('reveal')) el.classList.add('reveal');
          el.classList.add(el.closest('.side-actions') || el.matches('.side-card') ? 'reveal-right' : 'reveal-left');
          setDelay(el, Math.min(n, 20) * 92); n++;
        });
      });
    });

    qsa('.challenge-shell').forEach(function(shell){
      const left = shell.querySelector('.challenge-copy');
      const right = shell.querySelector('.challenge-side');
      if(left){ left.classList.add('reveal','reveal-left'); setDelay(left, 0); }
      if(right){ right.classList.add('reveal','reveal-right'); setDelay(right, 320); }
      qsa('.challenge-card,.challenge-mini', right || shell).forEach(function(el, i){ el.classList.add('reveal','reveal-right'); setDelay(el, 380 + i*110); });
    });
  }

  function setupReveal(){
    const items = qsa('.reveal');
    if(!items.length) return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){ items.forEach(el => el.classList.add('is-visible')); return; }
    // Ensure the animation is visible even for above-the-fold elements: classes are applied before this observer runs.
    const io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -10% 0px'});
    items.forEach(function(el){ io.observe(el); });
  }

  function setupScrollMotion(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const moving = qsa('.reveal').filter(function(el){ return !el.closest('.site-header') && !el.closest('.site-footer'); });
    let ticking = false;
    function update(){
      const vh = window.innerHeight || 800;
      moving.forEach(function(el){
        const r = el.getBoundingClientRect();
        if(r.bottom < -180 || r.top > vh + 180) return;
        const center = r.top + r.height/2;
        const ratio = clamp((center - vh/2)/(vh/2), -1, 1);
        let amp = 7;
        if(el.matches('.hero-side .photo-card,.letter-collage,.letters-showcase')) amp = -18;
        else if(el.matches('.hero-copy,.room-copy,.join')) amp = 9;
        else if(el.matches('.room-card,.compare-card,.minimum-card,.path-card,.source-card,.support-card,.proof-card,.challenge-card,.archive-card,.letter-card')) amp = 12;
        else if(el.matches('.btn,.hero-truths span,.evidence-pill,.evidence-chip')) amp = 5;
        el.style.setProperty('--motion-y', (ratio * amp).toFixed(2)+'px');
      });
      ticking = false;
    }
    function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
    update(); window.addEventListener('scroll', onScroll, {passive:true}); window.addEventListener('resize', onScroll);
  }

  addRevealTargets();
  setKinds();
  setupJoinForm();
  setupPrefillButtons();
  setupReveal();
  setupScrollMotion();
  setupProgress();
  setupActiveNav();
})();
