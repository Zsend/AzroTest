const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalCopy = document.getElementById('modalCopy');
const modalLinks = document.getElementById('modalLinks');
const panel = modal?.querySelector('.modal-panel');

const copy = {
  founder: ['Join founder access', 'Get beta updates, field-test notes, launch pricing, and first access when the CragLink Power beta opens.'],
  shop: ['Founder systems are coming', 'CragLink Power is in founder validation. Join the list for launch pricing, prototype drops, and field-test availability.'],
  search: ['Quick links', 'Jump to the parts of the CragLink system that matter most.'],
  support: ['Support', 'For now, founder support, warranty notes, compatibility, and setup documentation will be released with beta units.'],
  account: ['Founder account access', 'Accounts will open when beta reservations begin. Join the founder list so you are notified first.'],
  about: ['Built for basecamp power', 'CragLink Power is designed around DC-native Starlink Mini operation, solar recovery, vehicle charging, and field-ready outdoor use.'],
  architecture: ['Basecamp power architecture', 'Target architecture: 100Ah LiFePO4 battery, 300W+ solar input, safe fused harness, vehicle-charge ports, and DC-native efficiency.'],
  runtime: ['24-hour runtime target', 'The system is being designed around all-day Starlink Mini usage with conservative reserve and efficient DC power delivery.'],
  dc: ['DC-native efficiency', 'The core product thesis: avoid unnecessary inverter waste and power Starlink Mini through stable DC architecture.'],
  solar: ['Solar recovery', 'Designed around meaningful solar input for basecamp recovery instead of tiny trickle-charge panels.'],
  vehicle: ['Vehicle-charge ready', 'A future vehicle-charge module lets the system top up while driving without unsafe direct alternator-to-lithium wiring.'],
  system: ['CragLink Power System', 'A portable, modular basecamp power system built for Starlink Mini users who want less wiring confusion and more confidence in the field.'],
  output: ['Power output: Starlink Mini', 'Stable, clean DC power optimized for uptime and field setup.'],
  battery: ['Battery capacity: 100Ah LiFePO4', 'The target pack size for dependable all-day basecamp use without jumping into oversized AC power stations.'],
  rugged: ['Rugged and reliable', 'Built around premium components, clear labeling, fused branches, and a layout meant for hard outdoor use.'],
  modular: ['Modular design', 'Start with DC power, then add solar, vehicle charging, accessories, or larger capacity as your setup evolves.'],
  efficient: ['Efficient by design', 'DC-native architecture means less waste, cleaner runtime, and a simpler field system.'],
  usa: ['Designed for the field', 'The intent is simple parts, clear labels, and a repairable layout for real outdoor users.'],
  menu: ['Menu', 'Choose where to go next.'],
  field: ['Field stories', 'The Field Team page will collect beta reports, athlete notes, real conditions, and product truth from early users.']
};

function openModal(type='founder'){
  const [title, body] = copy[type] || copy.founder;
  modalTitle.textContent = title;
  modalCopy.textContent = body;
  modalLinks.innerHTML = '';
  if(['search','menu'].includes(type)){
    const links = [
      ['Systems', () => scrollToRegion('systems')],
      ['Power modules', () => scrollToRegion('modules')],
      ['Field Team', () => { location.href='field-team.html'; }],
      ['Compatibility', () => { location.href='legal.html'; }],
      ['Privacy', () => { location.href='privacy.html'; }]
    ];
    links.forEach(([label, fn]) => {
      const b=document.createElement('button'); b.type='button'; b.textContent=label; b.addEventListener('click',()=>{closeModal(); fn();}); modalLinks.appendChild(b);
    });
  } else {
    const a=document.createElement('a'); a.href='field-team.html'; a.textContent='See Field Team →'; modalLinks.appendChild(a);
    const b=document.createElement('button'); b.type='button'; b.textContent='View system section'; b.addEventListener('click',()=>{closeModal(); scrollToRegion('modules');}); modalLinks.appendChild(b);
  }
  modal.setAttribute('aria-hidden','false');
  setTimeout(()=>panel?.focus(), 20);
}
function closeModal(){modal.setAttribute('aria-hidden','true');}
function activeArtboard(){
  if(matchMedia('(max-width: 560px)').matches) return document.querySelector('.artboard-phone');
  if(matchMedia('(max-width: 940px)').matches) return document.querySelector('.artboard-tablet');
  return document.querySelector('.artboard-desktop');
}
function scrollToRegion(region){
  const board = activeArtboard();
  const img = board?.querySelector('img'); if(!img) return;
  const rect = img.getBoundingClientRect();
  const map = { top:0, systems:.39, modules:.50, field:.39, footer:.82 };
  const y = window.scrollY + rect.top + rect.height*(map[region] ?? 0);
  window.scrollTo({top: Math.max(0, y-34), behavior:'smooth'});
}

document.addEventListener('click', e => {
  const m = e.target.closest('[data-modal]');
  if(m){ e.preventDefault(); openModal(m.dataset.modal); }
  const s = e.target.closest('[data-scroll]');
  if(s){ e.preventDefault(); scrollToRegion(s.dataset.scroll); }
  if(e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });
