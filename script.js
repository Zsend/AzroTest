
const $=(s,root=document)=>root.querySelector(s);const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const drawer=$('.drawer');const modal=$('.modal');
$('.menu-toggle')?.addEventListener('click',()=>drawer.classList.add('is-open'));
$('.drawer-close')?.addEventListener('click',()=>drawer.classList.remove('is-open'));
$('.drawer-bg')?.addEventListener('click',()=>drawer.classList.remove('is-open'));
$$('[data-modal]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();const type=btn.dataset.modal; if(type==='architecture'){ $('#modal-eyebrow').textContent='Pilot architecture'; $('#modal-title').textContent='Option A+ first, expansion later.'; $('#modal-copy').textContent='BaseRelay is validating the Core DC Kit + Control Standard first. Custom batteries, solar, vehicle charging, deposits, hardware sales, and inventory funding remain gated until technical, safety, support, warranty, and validation conditions are met.';} else if(type==='search'){ $('#modal-eyebrow').textContent='Search'; $('#modal-title').textContent='Search is not active yet.'; $('#modal-copy').textContent='BaseRelay is in prelaunch validation. Use the validation form to get updates or ask about field testing.';} else { $('#modal-eyebrow').textContent='Validation access'; $('#modal-title').textContent='Join the BaseRelay validation list.'; $('#modal-copy').textContent='No payment, preorder, or hardware sale is being accepted through this site.';} modal.classList.add('is-open');}));
$$('[data-close], .modal-bg').forEach(el=>el.addEventListener('click',()=>modal.classList.remove('is-open')));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){modal?.classList.remove('is-open');drawer?.classList.remove('is-open');}});
