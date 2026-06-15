(function(){
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js','motion-ready');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
  function delay(el, ms){ if(el) el.style.setProperty('--reveal-delay', ms + 'ms'); }
  function mark(el, kind, ms){ if(!el) return; el.classList.add('reveal'); if(kind) el.classList.add(kind); if(ms !== undefined) delay(el, ms); }

  function setupJoinForm(){
    var form = document.getElementById('joinForm');
    if(!form) return;
    var emailTarget = (form.getAttribute('data-email') || 'hello@arightforall.com').trim();
    var help = form.querySelector('.form-help');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(form);
      var name = String(fd.get('name') || '').trim();
      var email = String(fd.get('email') || '').trim();
      var role = String(fd.get('role') || '').trim();
      var note = String(fd.get('note') || '').trim();
      var subject = 'Advisor/professional input — A Right For All';
      var body = ['Name: ' + (name || '—'), 'Email: ' + (email || '—'), 'Role / lane: ' + (role || '—'), '', 'How I can help:', note || '—'].join('\n');
      window.location.href = 'mailto:' + encodeURIComponent(emailTarget) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if(help) help.innerHTML = 'Your email draft should open now. If it does not, email <a href="mailto:' + emailTarget + '">' + emailTarget + '</a> directly.';
    });
  }

  function setupPrefillButtons(){
    qsa('[data-prefill-role]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var role = btn.getAttribute('data-prefill-role');
        var select = document.getElementById('role');
        if(select && role) select.value = role;
        var note = document.getElementById('note');
        if(note && !note.value.trim()){
          if(role === 'Funding / resource strategy') note.value = 'I can help pressure-test the sustainable funding/resource model while preserving free access for incarcerated users.';
          else if(role === 'Corrections / operations') note.value = 'I can help with facility reality, corrections operations, or the tablet environment.';
        }
      });
    });
  }

  function setupProgress(){
    function onScroll(){
      var max = Math.max(1, doc.scrollHeight - doc.clientHeight);
      doc.style.setProperty('--progress', ((window.scrollY / max) * 100).toFixed(2) + '%');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
  }

  function setupActiveNav(){
    var links = qsa('.nav-links a[href^="#"]');
    if(!links.length) return;
    var map = new Map();
    links.forEach(function(link){
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if(target){ map.set(target, link); }
    });
    if(!map.size) return;
    var io = new IntersectionObserver(function(entries){
      var visible = entries.filter(function(e){return e.isIntersecting;}).sort(function(a,b){return b.intersectionRatio-a.intersectionRatio;})[0];
      if(!visible) return;
      links.forEach(function(link){ link.classList.remove('is-active'); });
      var active = map.get(visible.target);
      if(active) active.classList.add('is-active');
    }, {rootMargin:'-22% 0px -58% 0px', threshold:[0.18,0.36,0.54]});
    map.forEach(function(_, section){ io.observe(section); });
  }

  function wireMotionTargets(){
    var baseSelectors = [
      '.hero-copy', '.hero .eyebrow', '.hero h1', '.hero h2', '.hero .lead', '.hero .support-line', '.hero-truths span', '.hero .cta-row .btn', '.hero-proof .proof-card', '.hero-side', '.hero-side .photo-card', '.hero-photo-frame', '.hero-photo-caption', '.evidence-footer', '.hero-side .thesis-card',
      '.section-head', '.compact-section-head', '.page-hero .eyebrow', '.page-hero .section-label', '.page-hero h1', '.page-lead', '.page-hero .cta-row .btn',
      '.room-copy', '.room-card', '.immersive-quote', '.compare-card', '.logic-band', '.logic-pill', '.declaration-card', '.callout', '.minimum-band',
      '.letter-intro-row', '.letter-collage', '.letters-showcase', '.evidence-pill', '.voice-card', '.letter-card', '.archive-card', '.source-card', '.source-bullets li',
      '.minimum-card', '.path-card', '.support-card', '.card', '.proof-card', '.panel.copy-panel', '.thesis-card', '.photo-card', '.national-hero .hero-side',
      '.join', '.join .section-label', '.join h2', '.join p', '.join-step', '.join .side-card', '.join .side-actions .btn', '.form-shell',
      '.challenge-section', '.challenge-shell', '.challenge-copy', '.challenge-side', '.challenge-card', '.challenge-mini', '.builders-note', '.precision-panel'
    ].join(', ');
    qsa(baseSelectors).forEach(function(el){ if(!el.closest('.site-header') && !el.closest('.site-footer')) mark(el, null); });

    qsa('.reveal').forEach(function(el){
      if(el.matches('.hero-copy,.room-copy,.letter-intro-row,.challenge-copy,.join,.join-copy')) el.classList.add('reveal-left');
      if(el.matches('.hero-side,.hero-side .photo-card,.letter-collage,.letters-showcase,.challenge-side,.national-hero .hero-side')) el.classList.add('reveal-right');
      if(el.matches('.section-head,.compact-section-head,.page-hero h1,.page-lead,.support-line,.callout,.declaration-card,.immersive-quote,.minimum-band')) el.classList.add('reveal-soft');
      if(el.matches('.btn,.hero-truths span,.evidence-pill,.evidence-chip,.logic-pill,.challenge-mini,.join-step')) el.classList.add('reveal-pop');
      if(el.matches('.photo-card,.hero-photo-frame,.letter-collage,.letters-showcase,.archive-card')) el.classList.add('reveal-clip');
      if(el.matches('.room-card,.compare-card,.minimum-card,.path-card,.source-card,.support-card,.proof-card,.voice-card,.letter-card,.card,.panel.copy-panel')) el.classList.add('reveal-rise');
    });

    function sequence(rootSel, selectors, step, start){
      qsa(rootSel).forEach(function(root){
        var n = 0;
        selectors.forEach(function(sel){
          qsa(sel, root).forEach(function(el){
            if(!el.classList.contains('reveal')) mark(el);
            if(!el.classList.contains('reveal-left') && !el.classList.contains('reveal-right') && !el.classList.contains('reveal-pop')){
              if(el.closest('.hero-side') || el.matches('.letter-collage,.letters-showcase')) el.classList.add('reveal-right');
              else el.classList.add('reveal-left');
            }
            delay(el, (start||0) + Math.min(n, 24) * (step||78)); n++;
          });
        });
      });
    }

    sequence('.hero', ['.eyebrow','h1','h2','.lead','.support-line','.hero-truths span','.cta-row .btn','.hero-proof .proof-card','.hero-side','.hero-side .photo-card','.hero-photo-frame','.hero-photo-caption','.evidence-footer','.hero-side .thesis-card'], 92, 0);
    sequence('.room-section', ['.room-copy','.room-card','.immersive-quote'], 110, 0);
    sequence('.join', ['.section-label','h2','p','.join-step','.form-shell','.side-card','.side-actions .btn'], 95, 0);
    sequence('.challenge-section', ['.challenge-copy','.challenge-side','.challenge-card','.challenge-mini'], 120, 0);

    qsa('.proof-grid,.support-grid,.minimum-grid,.path-grid,.letter-grid,.archive-grid,.sources-grid,.evidence-grid,.builders-grid,.public-record-grid,.vision-grid,.three-col,.two-col,.compare-grid,.logic-band,.hero-truths,.evidence-strip,.thesis-list,.compare-list,.source-bullets,.evidence-meta-line,.join-steps,.challenge-mini-grid').forEach(function(group){
      qsa(':scope > *', group).forEach(function(el,i){
        if(!el.classList.contains('reveal')) mark(el);
        if(!el.classList.contains('reveal-left') && !el.classList.contains('reveal-right') && !el.classList.contains('reveal-pop')) el.classList.add(i%2 ? 'reveal-right' : 'reveal-left');
        delay(el, Math.min(i,14)*78);
      });
    });
  }

  function setupReveal(){
    var items = qsa('.reveal');
    if(!items.length) return;
    if(reduce){ items.forEach(function(el){ el.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, {threshold:0.13, rootMargin:'0px 0px -12% 0px'});
    items.forEach(function(el){ io.observe(el); });
    // Make above-the-fold animation actually visible, not pre-completed before the paint.
    requestAnimationFrame(function(){ setTimeout(function(){ qsa('.hero .reveal').forEach(function(el){ if(el.getBoundingClientRect().top < window.innerHeight * .96) el.classList.add('is-visible'); }); }, 140); });
  }

  function setupContinuousMotion(){
    if(reduce) return;
    var moving = qsa('.reveal').filter(function(el){return !el.closest('.site-header') && !el.closest('.site-footer');});
    var ticking = false;
    function update(){
      var vh = window.innerHeight || 800;
      moving.forEach(function(el){
        var r = el.getBoundingClientRect();
        if(r.bottom < -220 || r.top > vh + 220) return;
        var center = r.top + r.height/2;
        var ratio = clamp((center - vh/2)/(vh/2), -1, 1);
        var amp = 10;
        if(el.matches('.hero-side .photo-card,.letter-collage,.letters-showcase,.photo-card')) amp = -18;
        else if(el.matches('.hero-copy,.room-copy,.join,.challenge-copy')) amp = 9;
        else if(el.matches('.room-card,.compare-card,.minimum-card,.path-card,.source-card,.support-card,.proof-card,.challenge-card,.archive-card,.letter-card,.card')) amp = 13;
        else if(el.matches('.btn,.hero-truths span,.evidence-pill,.evidence-chip,.logic-pill')) amp = 5;
        el.style.setProperty('--scroll-y', (ratio * amp).toFixed(2) + 'px');
        el.style.setProperty('--motion-y', (ratio * amp).toFixed(2) + 'px');
      });
      ticking = false;
    }
    function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
    update(); window.addEventListener('scroll', onScroll, {passive:true}); window.addEventListener('resize', onScroll);
  }

  wireMotionTargets();
  setupJoinForm();
  setupPrefillButtons();
  setupReveal();
  setupContinuousMotion();
  setupProgress();
  setupActiveNav();
})();
