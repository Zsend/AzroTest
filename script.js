const drawer=document.querySelector('.drawer');
const menuToggle=document.querySelector('.menu-toggle');
const drawerClose=document.querySelector('.drawer-close');
const modal=document.querySelector('.modal');
const modalTitle=document.getElementById('modal-title');
const modalEyebrow=document.getElementById('modal-eyebrow');
const modalCopy=document.getElementById('modal-copy');
const modalTriggers=document.querySelectorAll('[data-modal]');
const drawerLinks=drawer?drawer.querySelectorAll('a'):[];
function setLock(state){document.body.style.overflow=state?'hidden':'';}
function openDrawer(){if(!drawer)return;drawer.classList.add('open');setLock(true);menuToggle?.setAttribute('aria-expanded','true');}
function closeDrawer(){if(!drawer)return;drawer.classList.remove('open');setLock(false);menuToggle?.setAttribute('aria-expanded','false');}
menuToggle?.addEventListener('click',()=>drawer.classList.contains('open')?closeDrawer():openDrawer());
drawerClose?.addEventListener('click',closeDrawer); drawer?.querySelector('.drawer-bg')?.addEventListener('click',closeDrawer); drawerLinks.forEach(a=>a.addEventListener('click',closeDrawer));
function openModal(type='founder'){
  if(!modal) return;
  const content={
    founder:{eyebrow:'Founder access',title:'Get early CragLink updates.',copy:'Join the founder list for prototype updates, field testing, and first production availability.'},
    architecture:{eyebrow:'System architecture',title:'Basecamp power architecture',copy:'A DC-native system stack built around efficient charging, durable storage, and simple field operation.'},
    search:{eyebrow:'Search',title:'Search is coming soon.',copy:'For now, use the navigation or join the list and we will send product updates directly.'}
  }[type] || content?.founder;
  modalEyebrow.textContent=content.eyebrow; modalTitle.textContent=content.title; modalCopy.textContent=content.copy;
  modal.classList.add('open'); setLock(true);
}
function closeModal(){if(!modal)return;modal.classList.remove('open');setLock(false);}
modalTriggers.forEach(el=>el.addEventListener('click',()=>openModal(el.dataset.modal)));
modal?.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeDrawer();}});
