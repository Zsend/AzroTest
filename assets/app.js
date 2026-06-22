(() => {
  'use strict';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const menu=q('[data-menu-toggle]'), nav=q('[data-site-nav]');
  function closeMenu(){if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');nav.classList.remove('open');document.body.classList.remove('menu-open')}
  if(menu&&nav){
    menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);document.body.classList.toggle('menu-open',open)});
    qa('a',nav).forEach(a=>a.addEventListener('click',closeMenu));
    addEventListener('resize',()=>{if(innerWidth>980)closeMenu()});
    addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
  }
  qa('[data-year]').forEach(n=>n.textContent=String(new Date().getFullYear()));

  const reveal=qa('[data-reveal]');
  if(!reduce&&'IntersectionObserver' in window){
    reveal.forEach(n=>n.classList.add('reveal-prep'));
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}
    }),{rootMargin:'0px 0px -7%',threshold:.07});
    reveal.forEach(n=>io.observe(n));
  } else reveal.forEach(n=>n.classList.add('is-visible'));

  const charts=qa('[data-bar-chart]');
  if('IntersectionObserver' in window){
    const chartIO=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');chartIO.unobserve(entry.target)}
    }),{threshold:.18});
    charts.forEach(c=>chartIO.observe(c));
  } else charts.forEach(c=>c.classList.add('is-visible'));

  const contextHero=q('[data-context-hero]'), contextVisual=q('[data-context-visual]');
  const journeys=qa('[data-journey]');
  const pipelines=qa('[data-pipeline]');
  let ticking=false;
  function updateScrollEffects(){
    ticking=false;
    if(contextHero&&contextVisual){
      const r=contextHero.getBoundingClientRect();
      const travel=Math.max(r.height-innerHeight*.35,1);
      const p=reduce?1:clamp((-r.top+innerHeight*.08)/travel);
      contextVisual.style.setProperty('--context-progress',p.toFixed(3));
    }
    journeys.forEach(section=>{
      const r=section.getBoundingClientRect();
      const travel=Math.max(r.height-innerHeight*.32,1);
      const p=reduce?1:clamp((innerHeight*.76-r.top)/travel);
      section.style.setProperty('--journey-progress',p.toFixed(3));
      const steps=qa('[data-step]',section);
      steps.forEach((node,i)=>node.classList.toggle('is-passed',p>=(i/(Math.max(steps.length-1,1)))-.02));
    });
    pipelines.forEach(section=>{
      const r=section.getBoundingClientRect();
      const p=reduce?1:clamp((innerHeight*.78-r.top)/Math.max(r.height*.75,1));
      section.style.setProperty('--pipeline-progress',p.toFixed(3));
    });
  }
  function schedule(){if(!ticking){ticking=true;requestAnimationFrame(updateScrollEffects)}}
  if(contextHero||journeys.length||pipelines.length){addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);updateScrollEffects()}

  const tabs=qa('[data-tab]'), panels=qa('[data-panel]');
  const progressSteps=qa('.connect-progress > div');
  function activate(name,focus=false){
    if(!tabs.length)return;
    const valid=tabs.some(t=>t.dataset.tab===name)?name:'candidate';
    tabs.forEach(t=>{const on=t.dataset.tab===valid;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;if(on&&focus)t.focus()});
    panels.forEach(p=>{const on=p.dataset.panel===valid;p.hidden=!on;p.classList.toggle('active',on)});
    progressSteps.forEach((p,i)=>p.classList.toggle('active',i===0));
    history.replaceState(null,'',`${location.pathname}?path=${valid}`);
  }
  if(tabs.length){
    const requested=new URLSearchParams(location.search).get('path')||'candidate';
    activate(requested);
    tabs.forEach((tab,i)=>{
      tab.addEventListener('click',()=>activate(tab.dataset.tab));
      tab.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
        e.preventDefault();let next=i;
        if(['ArrowLeft','ArrowUp'].includes(e.key))next=(i-1+tabs.length)%tabs.length;
        if(['ArrowRight','ArrowDown'].includes(e.key))next=(i+1)%tabs.length;
        if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;
        activate(tabs[next].dataset.tab,true);
      });
    });
  }

  const clean=v=>String(v||'').replace(/\r\n?/g,'\n').trim();
  function formatForm(form){
    const path=form.dataset.path||'Network';
    const lines=[`PROHIBITION CAREERS — ${path.toUpperCase()}`,'','This private introduction was prepared on prohibitioncareers.com.',''];
    qa('[data-label]',form).forEach(field=>{
      let value=field.type==='checkbox'?(field.checked?'Yes':'No'):clean(field.value);
      if(!value)return;
      lines.push(`${field.dataset.label}:`,value,'');
    });
    lines.push('I understand that joining the network does not guarantee contact, referral, an interview, or employment.');
    return{subject:`${path} connection — Prohibition Careers`,body:lines.join('\n')};
  }
  qa('[data-email-form]').forEach(form=>{
    const panel=form.closest('[data-panel]');
    const preview=q('[data-message-preview]',panel), text=q('[data-message-text]',preview), mail=q('[data-mail-link]',preview), copy=q('[data-copy-message]',preview), status=q('[data-copy-status]',preview);
    let latest='';
    form.addEventListener('submit',e=>{
      e.preventDefault();if(!form.reportValidity())return;
      const msg=formatForm(form);latest=msg.body;text.textContent=msg.body;
      mail.href=`mailto:support@prohibitioncareers.com?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`;
      preview.classList.add('visible');progressSteps.forEach((p,i)=>p.classList.toggle('active',i===2));
      preview.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    });
    copy.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(latest)}catch{
        const area=document.createElement('textarea');area.value=latest;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();
      }
      status.textContent='Message copied.';
    });
    qa('input,textarea,select',form).forEach(field=>field.addEventListener('focus',()=>progressSteps.forEach((p,i)=>p.classList.toggle('active',i===1)),{once:true}));
  });
})();
