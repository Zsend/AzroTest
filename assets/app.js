(() => {
  'use strict';
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const menu=q('[data-menu-toggle]'), nav=q('[data-site-nav]');
  const closeMenu=()=>{if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');nav.classList.remove('open');document.body.classList.remove('menu-open')};
  if(menu&&nav){
    menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);document.body.classList.toggle('menu-open',open)});
    qa('a',nav).forEach(a=>a.addEventListener('click',closeMenu));
    addEventListener('resize',()=>{if(innerWidth>980)closeMenu()});
    addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  }
  qa('[data-year]').forEach(n=>n.textContent=String(new Date().getFullYear()));

  const reveal=qa('[data-reveal], [data-reveal-group]');
  if(!reduce && 'IntersectionObserver' in window){
    reveal.forEach(n=>n.classList.add(n.hasAttribute('data-reveal-group')?'reveal-group':'reveal-prep'));
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{rootMargin:'0px 0px -7%',threshold:.08});
    reveal.forEach(n=>io.observe(n));
  } else reveal.forEach(n=>n.classList.add('is-visible'));

  const charts=qa('[data-chart]');
  if('IntersectionObserver' in window){
    const cio=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');cio.unobserve(e.target)}}),{threshold:.16});
    charts.forEach(n=>cio.observe(n));
  } else charts.forEach(n=>n.classList.add('is-visible'));

  const hero=q('[data-hero-scroll]'), ledger=q('[data-context-ledger]'), paths=qa('[data-path-scroll]');
  let ticking=false;
  const update=()=>{
    ticking=false;
    if(hero){const r=hero.getBoundingClientRect();const p=reduce?1:clamp((-r.top+innerHeight*.08)/Math.max(r.height-innerHeight*.36,1));document.documentElement.style.setProperty('--grid-shift',p.toFixed(3));if(ledger)ledger.style.setProperty('--scan',(0.2+p*.68).toFixed(3));}
    paths.forEach(section=>{const r=section.getBoundingClientRect();const p=reduce?1:clamp((innerHeight*.78-r.top)/Math.max(r.height*.72,1));section.style.setProperty('--path-progress',p.toFixed(3));const steps=qa('[data-path-step]',section);steps.forEach((n,i)=>n.classList.toggle('is-active',p>=i/Math.max(steps.length-1,1)-.02));});
  };
  const schedule=()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}};
  if(hero||paths.length){addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update()}

  const counterEls=qa('[data-impact-key]');
  if(counterEls.length){
    fetch('./assets/impact.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
      counterEls.forEach(el=>{const key=el.dataset.impactKey;const val=Number(data[key]??0);el.textContent=String(val)});
      qa('[data-impact-date]').forEach(el=>el.textContent=data.lastUpdated||'Not yet reported');
    }).catch(()=>{});
  }

  const clean=v=>String(v||'').replace(/\r\n?/g,'\n').trim();
  const formatForm=form=>{
    const kind=form.dataset.kind||'Connection';
    const lines=[`PROHIBITION CAREERS — ${kind.toUpperCase()}`,'','This private message was prepared on prohibitioncareers.com.',''];
    qa('[data-label]',form).forEach(field=>{
      const value=field.type==='checkbox'?(field.checked?'Yes':'No'):clean(field.value);
      if(!value)return;lines.push(`${field.dataset.label}:`,value,'');
    });
    lines.push('I understand that Prohibition Careers does not guarantee contact, referral, an interview, or employment.');
    return {subject:`${kind} — Prohibition Careers`,body:lines.join('\n')};
  };
  qa('[data-email-form]').forEach(form=>{
    const preview=q('[data-message-preview]',form.parentElement), text=q('[data-message-text]',preview), mail=q('[data-mail-link]',preview), copy=q('[data-copy-message]',preview), status=q('[data-copy-status]',preview);let latest='';
    form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const msg=formatForm(form);latest=msg.body;text.textContent=msg.body;mail.href=`mailto:support@prohibitioncareers.com?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`;preview.classList.add('visible');preview.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})});
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(latest)}catch{const a=document.createElement('textarea');a.value=latest;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.append(a);a.select();document.execCommand('copy');a.remove()}status.textContent='Message copied.'});
  });
})();
