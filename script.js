(function(){
  const modalLayer = document.getElementById('modalLayer');
  const modal = modalLayer?.querySelector('.modal');
  const title = document.getElementById('modalTitle');
  const kicker = document.getElementById('modalKicker');
  const text = document.getElementById('modalText');
  const email = document.getElementById('modal-email');
  const toast = document.getElementById('toast');
  const panel = document.querySelector('.mobile-panel');

  const copy = {
    reserve:['Founder access','Join the founder list','Get early access to pricing, launch timing, field testing notes, and founder-only product updates.'],
    search:['Quick links','What are you looking for?','Request system architecture, battery sizing, solar options, vehicle charging, wholesale information, or Field Team access.'],
    cart:['Founder beta','Systems are not live yet','CragLink is in founder validation. Join the list and we will send product options, beta availability, and preorder details.'],
    account:['Early access','Create founder access','Founder accounts will open before public launch. Join the list to receive an invitation.'],
    support:['Support','Support and compatibility','Ask for wiring diagrams, Starlink Mini compatibility notes, field-test updates, warranty details, or wholesale support.'],
    about:['About CragLink','Built for basecamp power','CragLink Power is a DC-native basecamp power concept for outdoor users who need reliable Starlink Mini uptime without oversized power stations.'],
    architecture:['System architecture','DC-native by design','Target architecture: 100Ah LiFePO4 battery class, 300W+ solar input, safe fused harness, vehicle-charge ports, and regulated Starlink Mini DC output.'],
    runtime:['Runtime target','Designed around 24-hour use','The founder system is sized around a 100Ah LiFePO4 class battery and Starlink Mini all-day operation, with final runtime validated during field testing.'],
    dc:['DC-native efficiency','No power-station tax','CragLink is built around clean DC power to reduce unnecessary inverter losses and simplify the system around Starlink Mini.'],
    solar:['Solar recovery','Built for multi-day trips','The system target includes 300W+ solar recovery so basecamp can replenish power in decent sun without relying only on the vehicle.'],
    vehicle:['Vehicle charging','Top up while moving','Vehicle-charge-ready architecture lets the system recharge from the car later without turning the car into the whole power system.'],
    warranty:['Warranty','Built to be supported','Warranty terms will be finalized before public launch. Founder customers will receive clear support, compatibility, and return policies.']
  };

  function showToast(message){
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.t);
    showToast.t = setTimeout(()=> toast.hidden = true, 3200);
  }
  function openModal(kind='reserve'){
    const c = copy[kind] || copy.reserve;
    kicker.textContent = c[0]; title.textContent = c[1]; text.textContent = c[2];
    modalLayer.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(()=>{ modal?.focus(); if(kind==='reserve') email?.focus(); }, 40);
  }
  function closeModal(){ modalLayer.hidden = true; document.body.style.overflow = ''; }
  function closePanel(){ panel.hidden = true; document.body.style.overflow = ''; }

  document.addEventListener('click', (event)=>{
    const modalTrigger = event.target.closest('[data-modal]');
    if(modalTrigger){ event.preventDefault(); openModal(modalTrigger.dataset.modal); closePanel(); return; }
    if(event.target.closest('[data-close]')){ event.preventDefault(); closeModal(); return; }
    if(event.target.closest('[data-menu]')){ event.preventDefault(); panel.hidden = false; document.body.style.overflow = 'hidden'; return; }
    if(event.target.closest('[data-menu-close]')){ event.preventDefault(); closePanel(); return; }
    if(panel && !panel.hidden && event.target.matches('.mobile-panel a')) closePanel();
  });
  document.addEventListener('keydown', (event)=>{ if(event.key === 'Escape'){ if(!modalLayer.hidden) closeModal(); if(panel && !panel.hidden) closePanel(); }});

  document.querySelectorAll('[data-local-form]').forEach(form=>{
    form.addEventListener('submit', (event)=>{
      event.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      if(!emailInput || !emailInput.checkValidity()){ emailInput?.reportValidity(); return; }
      try{
        const leads = JSON.parse(localStorage.getItem('craglink_leads') || '[]');
        leads.push({email: emailInput.value, source: form.name || 'form', interest: form.querySelector('select')?.value || '', createdAt: new Date().toISOString()});
        localStorage.setItem('craglink_leads', JSON.stringify(leads));
      }catch(e){}
      form.reset(); closeModal(); showToast('You are on the CragLink founder list.');
    });
  });
})();
