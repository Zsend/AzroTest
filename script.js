const drawer=document.querySelector('.drawer');
const menuToggle=document.querySelector('.menu-toggle');
const drawerClose=document.querySelector('.drawer-close');
const modal=document.querySelector('.modal');
const modalTitle=document.getElementById('modal-title');
const modalEyebrow=document.getElementById('modal-eyebrow');
const modalCopy=document.getElementById('modal-copy');
function setLock(state){document.body.style.overflow=state?'hidden':''}
function openDrawer(){drawer?.classList.add('open');setLock(true);menuToggle?.setAttribute('aria-expanded','true')}
function closeDrawer(){drawer?.classList.remove('open');setLock(false);menuToggle?.setAttribute('aria-expanded','false')}
menuToggle?.addEventListener('click',()=>drawer?.classList.contains('open')?closeDrawer():openDrawer());
drawerClose?.addEventListener('click',closeDrawer);drawer?.querySelector('.drawer-bg')?.addEventListener('click',closeDrawer);drawer?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeDrawer));
function openModal(type='founder'){if(!modal)return;const c={founder:['Founder access','Get early CragLink updates.','Join the founder list for prototype updates, field testing, and first production availability.'],architecture:['System architecture','Basecamp power architecture','A DC-native system stack built around efficient charging, durable storage, and simple field operation.'],search:['Search','Search is coming soon.','For now, use the navigation or join the list and we will send product updates directly.']}[type]||['Founder access','Get early CragLink updates.','Join the founder list for prototype updates, field testing, and first production availability.'];modalEyebrow.textContent=c[0];modalTitle.textContent=c[1];modalCopy.textContent=c[2];modal.classList.add('open');setLock(true)}
function closeModal(){modal?.classList.remove('open');setLock(false)}
document.querySelectorAll('[data-modal]').forEach(el=>el.addEventListener('click',()=>openModal(el.dataset.modal)));
modal?.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeDrawer()}})
