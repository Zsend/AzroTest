
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
      const body = ['Name: ' + (name || '—'),'Email: ' + (email || '—'),'Role / lane: ' + (role || '—'),'','How I can help:',note || '—'].join('\n');
      window.location.href = 'mailto:' + encodeURIComponent(emailTarget) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if(help){help.innerHTML = 'Your email draft should open now. If it does not, email <a href="mailto:' + emailTarget + '">' + emailTarget + '</a> directly.';}
    });
  }
  function setupPrefillButtons(){
    document.querySelectorAll('[data-prefill-role]').forEach(function(btn){
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
  function addRevealTargets(){
    const selectors = [
      '.section-head', '.compact-section-head', '.page-hero .eyebrow', '.page-hero .section-label', '.page-hero .breadcrumbs', '.page-hero h1', '.page-lead', '.page-hero .cta-row .btn',
      '.hero-copy', '.hero-side', '.hero .eyebrow', '.hero h1', '.hero .lead', '.hero .support-line', '.hero-truths span', '.hero .cta-row .btn', '.hero-proof .proof-card', '.hero-photo-frame', '.hero-photo-caption', '.evidence-footer', '.hero-side .photo-card', '.hero-side .thesis-card',
      '.card', '.letter-card', '.archive-card', '.minimum-card', '.path-card', '.support-card', '.source-card', '.compare-card', '.proof-card', '.voice-card', '.room-card', '.panel.copy-panel', '.declaration-card', '.minimum-band', '.logic-pill', '.evidence-pill', '.evidence-chip', '.immersive-quote', '.callout', '.archive-link',
      '.letter-collage', '.letters-showcase', '.letter-intro-row', '.join', '.join-grid', '.join h2', '.join .section-label', '.join p', '.join-step', '.join .side-card', '.side-actions', '.form-shell', '.challenge-section', '.challenge-shell', '.challenge-copy', '.challenge-side', '.challenge-card', '.challenge-mini', '.room-copy', '.room-stack', '.standard-clause .copy-panel', '.funding-disclaimer .copy-panel', '.national-hero .thesis-card'
    ].join(', ');
    document.querySelectorAll(selectors).forEach(function(el){
      if(el.closest('.site-header') || el.closest('.site-footer')) return;
      if(!el.classList.contains('reveal')) el.classList.add('reveal');
    });
  }
  function setDelay(el, ms){ el.style.setProperty('--reveal-delay', ms + 'ms'); }
  function choreographReveals(){
    document.querySelectorAll('.reveal').forEach(function(el){
      el.style.setProperty('--reveal-delay', el.style.getPropertyValue('--reveal-delay') || '0ms');
      if(el.matches('.hero-copy, .room-copy, .letter-intro-row, .challenge-copy')) el.classList.add('reveal-left');
      if(el.matches('.hero-side, .letter-collage, .letters-showcase, .challenge-side, .hero-side .photo-card')) el.classList.add('reveal-right');
      if(el.matches('.section-head, .compact-section-head, .page-hero h1, .page-lead, .support-line, .declaration-card, .immersive-quote')) el.classList.add('reveal-soft');
      if(el.matches('.btn, .hero-truths span, .evidence-pill, .evidence-chip, .logic-pill, .challenge-mini')) el.classList.add('reveal-pop');
      if(el.matches('.photo-card, .letter-collage, .archive-card, .source-card')) el.classList.add('reveal-clip');
    });
    document.querySelectorAll('.hero').forEach(function(hero){
      let i=0;
      ['.eyebrow','h1','.lead','.support-line','.hero-truths span','.cta-row .btn','.hero-proof .proof-card','.photo-card','.hero-photo-frame','.hero-photo-caption','.evidence-footer','.thesis-card'].forEach(function(sel){
        hero.querySelectorAll(sel).forEach(function(el){
          if(!el.classList.contains('reveal')) return;
          if(el.closest('.hero-side')) el.classList.add('reveal-right');
          else if(el.matches('.hero-truths span,.cta-row .btn,.proof-card')) el.classList.add('reveal-pop');
          else el.classList.add('reveal-left');
          setDelay(el, Math.min(i,18)*86); i++;
        });
      });
    });
    document.querySelectorAll('.room-section').forEach(function(section){
      let i=0;
      ['.room-copy','.room-card','.immersive-quote'].forEach(function(sel){
        section.querySelectorAll(sel).forEach(function(el){ if(!el.classList.contains('reveal')) return; el.classList.add(sel === '.room-copy' ? 'reveal-left' : 'reveal-right'); setDelay(el, Math.min(i,12)*96); i++; });
      });
    });
    ['.proof-grid','.support-grid','.minimum-grid','.path-grid','.letter-grid','.archive-grid','.sources-grid','.evidence-grid','.builders-grid','.public-record-grid','.vision-grid','.three-col','.two-col','.room-grid','.compare-grid','.logic-band','.hero-truths','.evidence-strip','.thesis-list','.compare-list','.source-bullets','.evidence-meta-line','.join-steps'].forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(group){Array.from(group.children).forEach(function(child,index){if(!child.classList||!child.classList.contains('reveal')) return; child.classList.add(index%2===0?'reveal-left':'reveal-right'); if(index>2) child.classList.add('reveal-rise'); setDelay(child, Math.min(index,9)*70);});});
    });
    document.querySelectorAll('.join').forEach(function(join){let n=0; ['.section-label','h2','p','.join-step','.form-shell','.side-card','.btn'].forEach(function(sel){join.querySelectorAll(sel).forEach(function(el){if(!el.classList.contains('reveal')) return; if(el.closest('.side-actions')) el.classList.add('reveal-right'); else el.classList.add('reveal-left'); if(el.matches('.btn,.join-step strong')) el.classList.add('reveal-pop'); setDelay(el, Math.min(n,18)*96); n++;});});});
    document.querySelectorAll('.challenge-shell').forEach(function(shell){const left=shell.querySelector('.challenge-copy'); const right=shell.querySelector('.challenge-side, .challenge-card'); if(left&&left.classList.contains('reveal')) setDelay(left,0); if(right&&right.classList.contains('reveal')) setDelay(right,260);});
  }
  function setupReveal(){
    const items = Array.from(document.querySelectorAll('.reveal'));
    if(!items.length) return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){items.forEach(function(el){el.classList.add('is-visible');}); return;}
    const io = new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}});},{threshold:0.08, rootMargin:'0px 0px -8% 0px'});
    items.forEach(function(el){io.observe(el);});
    // Force first-screen choreography to run after first paint so it is visible on load.
    requestAnimationFrame(function(){setTimeout(function(){document.querySelectorAll('.hero .reveal').forEach(function(el){el.classList.add('is-visible');});},90);});
  }
  function setupProgress(){
    const onScroll = function(){const doc=document.documentElement; const max=Math.max(1,doc.scrollHeight-doc.clientHeight); doc.style.setProperty('--progress',((window.scrollY/max)*100).toFixed(2)+'%');};
    onScroll(); window.addEventListener('scroll',onScroll,{passive:true}); window.addEventListener('resize',onScroll);
  }
  function setupScrollMotion(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const moving = Array.from(document.querySelectorAll('.hero .photo-card,.hero-copy,.room-card,.compare-card,.minimum-card,.path-card,.source-card,.support-card,.proof-card,.join .side-card,.challenge-card,.archive-card,.letter-collage,.letters-showcase'));
    if(!moving.length) return;
    let ticking=false;
    function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
    function update(){
      const vh=window.innerHeight||800;
      moving.forEach(function(el){
        const r=el.getBoundingClientRect();
        if(r.bottom < -120 || r.top > vh + 120) return;
        const center = r.top + r.height/2;
        const ratio = clamp((center - vh/2)/(vh/2), -1, 1);
        let amp = 10;
        if(el.matches('.hero .photo-card,.letter-collage,.letters-showcase')) amp = -18;
        else if(el.matches('.hero-copy')) amp = 8;
        else if(el.matches('.join .side-card,.challenge-card')) amp = 12;
        else amp = 9;
        const y = (ratio * amp).toFixed(2)+'px';
        if(el.matches('.hero .photo-card')) el.style.setProperty('--photo-parallax', y);
        else if(el.matches('.hero-copy')) el.style.setProperty('--copy-parallax', y);
        else if(el.matches('.letter-collage,.letters-showcase')) el.style.setProperty('--collage-parallax', y);
        else el.style.setProperty('--card-parallax', y);
      });
      ticking=false;
    }
    function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
    update(); window.addEventListener('scroll',onScroll,{passive:true}); window.addEventListener('resize',onScroll);
  }
  function setupActiveNav(){
    const links=Array.from(document.querySelectorAll('.nav-links a[href^="#"]')); if(!links.length) return;
    const map=new Map(); links.forEach(function(link){const target=document.getElementById(link.getAttribute('href').slice(1)); if(target){target.setAttribute('data-section',''); map.set(target,link);}});
    const observer=new IntersectionObserver(function(entries){const visible=entries.filter(function(e){return e.isIntersecting;}).sort(function(a,b){return b.intersectionRatio-a.intersectionRatio;})[0]; if(!visible) return; links.forEach(function(link){link.classList.remove('is-active');}); const link=map.get(visible.target); if(link) link.classList.add('is-active');},{rootMargin:'-20% 0px -60% 0px',threshold:[0.2,0.4,0.6]});
    map.forEach(function(_,section){observer.observe(section);});
  }
  setupJoinForm(); setupPrefillButtons(); addRevealTargets(); choreographReveals(); setupReveal(); setupScrollMotion(); setupProgress(); setupActiveNav();
})();
