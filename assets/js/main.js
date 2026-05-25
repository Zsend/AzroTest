
(function(){
  const nav=document.querySelector('[data-nav]');
  const toggle=document.querySelector('[data-menu-toggle]');
  if(nav&&toggle){
    toggle.addEventListener('click',()=>{const isOpen=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(isOpen));});
    nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');}));
  }
  const statusPills=document.querySelectorAll('[data-open-status]');
  if(statusPills.length){
    const now=new Date();
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Denver',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(now).reduce((acc,part)=>{acc[part.type]=part.value;return acc;},{});
    const day=parts.weekday,hour=Number(parts.hour),minute=Number(parts.minute),current=hour*60+minute;
    const ranges={Mon:[660,1140],Tue:[660,1140],Wed:[660,1140],Thu:[660,1140],Fri:[660,1140],Sat:[600,1140],Sun:[720,1020]};
    const range=ranges[day],open=range&&current>=range[0]&&current<range[1];
    statusPills.forEach(pill=>{const label=pill.querySelector('[data-open-label]');pill.dataset.state=open?'open':'closed';if(label)label.textContent=open?'Open now':'Closed now';pill.setAttribute('aria-label',open?'Mark’s Ark is currently open':'Mark’s Ark is currently closed');});
  }
})();
