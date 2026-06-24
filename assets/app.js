
document.documentElement.classList.add('js');

const menuButton = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-site-nav]');
if(menuButton && nav){
  menuButton.addEventListener('click',()=>{
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    nav.classList.toggle('open', !open);
    document.body.classList.toggle('menu-open', !open);
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    menuButton.setAttribute('aria-expanded','false');
    menuButton.setAttribute('aria-label','Open menu');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
  }));
}

document.querySelectorAll('[data-year]').forEach(el=>el.textContent = new Date().getFullYear());

const process = document.querySelector('[data-process]');
if(process){
  const updateProcess = ()=>{
    const rect = process.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const start = vh * .72;
    const end = vh * .24;
    const total = rect.height + start - end;
    const progressed = start - rect.top;
    const value = Math.max(0, Math.min(1, progressed / total));
    process.style.setProperty('--process-progress', value.toFixed(4));
  };
  updateProcess();
  addEventListener('scroll',updateProcess,{passive:true});
  addEventListener('resize',updateProcess);
}

function clean(v){ return String(v || '').trim(); }
function buildMail(form){
  const fd = new FormData(form);
  const type = form.dataset.mailType || 'Connection';
  const lines = ['Prohibition Careers', type, '', 'This private message was prepared on prohibitioncareers.com.', ''];
  for(const [key, value] of fd.entries()){
    if(key.startsWith('_')) continue;
    const label = key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
    lines.push(`${label}: ${clean(value) || '—'}`);
  }
  lines.push('', 'I understand that joining the network does not guarantee contact, referral, an interview, or employment.');
  return lines.join('\n');
}

document.querySelectorAll('[data-mail-form]').forEach(form=>{
  const dialog = document.querySelector('#review-dialog');
  const pre = dialog?.querySelector('[data-review-text]');
  const mailLink = dialog?.querySelector('[data-mail-link]');
  const copyButton = dialog?.querySelector('[data-copy-message]');
  const status = dialog?.querySelector('[data-copy-status]');
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity()) return;
    const message = buildMail(form);
    const subject = `${form.dataset.mailType || 'Connection'} — Prohibition Careers`;
    if(pre) pre.textContent = message;
    if(mailLink) mailLink.href = `mailto:support@prohibitioncareers.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    if(copyButton) copyButton.dataset.message = message;
    if(status) status.textContent = '';
    dialog?.showModal();
  });
  copyButton?.addEventListener('click',async()=>{
    const message = copyButton.dataset.message || '';
    try{ await navigator.clipboard.writeText(message); if(status) status.textContent='Message copied.'; }
    catch{ if(status) status.textContent='Copy failed. Select the message above and copy it manually.'; }
  });
});

document.querySelectorAll('[data-dialog-close]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('dialog')?.close()));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{ if(e.target===dialog) dialog.close(); }));
