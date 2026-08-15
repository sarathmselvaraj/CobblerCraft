// CobblerCraft direct in-page service booking — guest + signed-in friendly.
(function(){
  'use strict';
  const SERVICES={
    'sole-replacement':'Sole Replacement','heel-repair':'Heel Repair','leather-polishing':'Leather Polishing',
    'stitching-seams':'Stitching & Seams','leather-restoration':'Leather Restoration','wax-creaming':'Wax & Creaming',
    'leather-care':'Leather Care','orthopaedic-work':'Orthopaedic Work','sneaker-cleaning':'Sneaker Deep Cleaning'
  };
  const BOOKINGS_KEY='cc-service-bookings-v1';
  const USERS_KEY='cc-auth-users-v1';
  const SESSION_KEY='cc-auth-session-v1';
  let activeSlug='';

  function session(){
    for(const store of [localStorage,sessionStorage]){
      try{const raw=store.getItem(SESSION_KEY);if(raw)return JSON.parse(raw);}catch(e){}
    }
    return null;
  }
  function users(){try{const d=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');return Array.isArray(d)?d:[];}catch{return[];}}
  function currentUser(s){return users().find(u=>u.id===s?.id)||users().find(u=>(u.email||'').toLowerCase()===(s?.email||'').toLowerCase())||s||{};}
  function serviceOptions(){
    return '<option value="">Choose a repair service</option>'+Object.entries(SERVICES).map(([slug,name])=>`<option value="${slug}">${name}</option>`).join('');
  }
  function makeModal(){
    const wrap=document.createElement('div');
    wrap.className='cc-booking-modal';wrap.setAttribute('data-booking-modal','');wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML=`<div class="cc-booking-dialog" role="dialog" aria-modal="true" aria-labelledby="cc-booking-title">
      <div class="cc-booking-head"><div><span class="chip">Service booking</span><h2 class="display mt-3 text-2xl font-bold" id="cc-booking-title">Book a CobblerCraft service</h2><p class="muted mt-1 text-sm">Choose a service and tell us when you would like to hand over your footwear. No account is required.</p></div><button class="cc-booking-close" type="button" data-booking-close aria-label="Close booking">×</button></div>
      <div class="cc-booking-body">
        <div class="cc-booking-selected"><div><span class="muted block text-xs uppercase tracking-wider">Booking</span><strong data-booking-service-name>Choose a service below</strong></div><span class="chip">Direct form</span></div>
        <form data-service-booking-form novalidate>
          <div class="cc-booking-grid">
            <div class="cc-booking-service-field"><label class="mb-1.5 block text-sm font-medium" for="cc-book-service">Service</label><select class="input cc-booking-service-select" id="cc-book-service" name="service" required>${serviceOptions()}</select><p class="cc-booking-helper">If you clicked a service card, that service is selected automatically. You can still change it here.</p></div>
            <div><label class="mb-1.5 block text-sm font-medium" for="cc-book-name">Full name</label><input class="input" id="cc-book-name" name="name" required minlength="2" autocomplete="name" placeholder="Your name"></div>
            <div><label class="mb-1.5 block text-sm font-medium" for="cc-book-email">Email</label><input class="input" id="cc-book-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
            <div><label class="mb-1.5 block text-sm font-medium" for="cc-book-phone">Phone</label><input class="input" id="cc-book-phone" name="phone" type="tel" required autocomplete="tel" pattern="[0-9+()\\- ]{7,20}" placeholder="+1 555 000 0000"></div>
            <div><label class="mb-1.5 block text-sm font-medium" for="cc-book-date">Preferred date</label><input class="input" id="cc-book-date" name="date" type="date" required></div>
            <div class="cc-full"><span class="mb-2 block text-sm font-medium">How will you hand over the footwear?</span><div class="cc-handover-options" role="radiogroup" aria-label="Handover method"><label class="cc-handover-option"><input type="radio" name="fulfillment" value="store" checked><span><strong>Store Handover</strong><small>Bring the footwear directly to the CobblerCraft workshop.</small></span></label><label class="cc-handover-option"><input type="radio" name="fulfillment" value="pickup"><span><strong>Pickup & Delivery</strong><small>Request collection and return delivery after the repair.</small></span></label></div></div>
            <div class="cc-full cc-pickup-address hidden" data-pickup-address><label class="mb-1.5 block text-sm font-medium" for="cc-book-address">Pickup & delivery address</label><textarea class="input" id="cc-book-address" name="pickupAddress" rows="3" placeholder="House / street, city and postcode"></textarea><p class="cc-booking-helper">The workshop will confirm pickup availability after the request is received.</p></div>
            <div class="cc-full"><label class="mb-1.5 block text-sm font-medium" for="cc-book-notes">Repair notes</label><textarea class="input" id="cc-book-notes" name="notes" rows="4" placeholder="Describe the damage, shoe type, brand or any special request."></textarea></div>
          </div>
          <label class="mt-4 flex items-start gap-3 text-sm"><input class="mt-1" name="consent" type="checkbox" required><span class="muted">I agree to be contacted about this booking request.</span></label>
          <div class="cc-booking-actions mt-5"><button class="btn btn-primary" type="submit">Book Service</button><button class="btn btn-ghost" type="button" data-booking-close>Cancel</button><a class="btn btn-ghost" data-booking-profile-link href="profile.html">My bookings</a></div>
          <div class="cc-booking-success" data-booking-success role="status" aria-live="polite"></div>
        </form>
      </div></div>`;
    document.body.appendChild(wrap);return wrap;
  }
  function getModal(){return document.querySelector('[data-booking-modal]')||makeModal();}
  function updateSelected(modal){
    const select=modal.querySelector('#cc-book-service');
    activeSlug=select?.value||'';
    const name=modal.querySelector('[data-booking-service-name]');
    if(name)name.textContent=activeSlug&&SERVICES[activeSlug]?SERVICES[activeSlug]:'Choose a service below';
  }
  function updateHandoverFields(modal){
    const choice=modal.querySelector('input[name="fulfillment"]:checked');
    const pickup=modal.querySelector('[data-pickup-address]');const address=modal.querySelector('#cc-book-address');
    const isPickup=choice&&choice.value==='pickup';if(pickup)pickup.classList.toggle('hidden',!isPickup);
    if(address){address.required=Boolean(isPickup);if(!isPickup)address.removeAttribute('aria-invalid');}
  }
  function setMinDate(modal){
    const d=modal.querySelector('#cc-book-date');if(!d)return;
    const today=new Date();const y=today.getFullYear(),m=String(today.getMonth()+1).padStart(2,'0'),day=String(today.getDate()).padStart(2,'0');d.min=`${y}-${m}-${day}`;
  }
  function prefill(modal){
    const s=session(),u=currentUser(s);
    modal.querySelector('#cc-book-name').value=[u.firstName,u.lastName].filter(Boolean).join(' ')||u.name||'';
    modal.querySelector('#cc-book-email').value=s?.email||u.email||'';
    modal.querySelector('#cc-book-phone').value=u.phone||'';
    const saved=[u.address,u.city,u.postcode].filter(Boolean).join(', ');if(saved)modal.querySelector('#cc-book-address').value=saved;
    const profile=modal.querySelector('[data-booking-profile-link]');if(profile)profile.style.display=s?'inline-flex':'none';
  }
  function openBooking(slug){
    const modal=getModal();
    const select=modal.querySelector('#cc-book-service');
    if(slug&&SERVICES[slug])select.value=slug;else if(!select.value)select.value='';
    updateSelected(modal);setMinDate(modal);prefill(modal);
    const store=modal.querySelector('input[name="fulfillment"][value="store"]');if(store)store.checked=true;updateHandoverFields(modal);
    const success=modal.querySelector('[data-booking-success]');if(success){success.classList.remove('is-visible');success.innerHTML='';}
    const submit=modal.querySelector('button[type="submit"]');if(submit){submit.disabled=false;submit.textContent='Book Service';}
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.classList.add('cc-modal-open');
    setTimeout(()=>{(slug?modal.querySelector('#cc-book-name'):select)?.focus();},70);
  }
  function closeBooking(){const modal=document.querySelector('[data-booking-modal]');if(!modal)return;modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('cc-modal-open');}
  function saveBooking(form){
    const data=Object.fromEntries(new FormData(form).entries());const s=session();const slug=data.service;
    if(!SERVICES[slug])throw new Error('SERVICE_REQUIRED');
    const ref='CC-'+Date.now().toString(36).toUpperCase().slice(-8);
    const booking={reference:ref,userId:s?.id||'',serviceSlug:slug,serviceName:SERVICES[slug],name:(data.name||'').trim(),email:(data.email||'').trim(),phone:(data.phone||'').trim(),date:data.date,handoverMethod:data.fulfillment==='pickup'?'Pickup & Delivery':'Store Handover',pickupAddress:data.fulfillment==='pickup'?(data.pickupAddress||'').trim():'',notes:(data.notes||'').trim(),createdAt:new Date().toISOString(),status:'Requested',source:s?'account':'guest'};
    let list=[];try{list=JSON.parse(localStorage.getItem(BOOKINGS_KEY)||'[]');if(!Array.isArray(list))list=[];}catch(e){list=[];}
    list.push(booking);localStorage.setItem(BOOKINGS_KEY,JSON.stringify(list));localStorage.setItem('cc-last-booking-ref',ref);return booking;
  }
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('[data-book-service],[data-service-book],[data-open-booking]');
    if(trigger){e.preventDefault();const slug=trigger.getAttribute('data-book-service')||trigger.closest('[data-service-slug]')?.getAttribute('data-service-slug')||new URLSearchParams(location.search).get('service')||'';openBooking(slug);return;}
    if(e.target.closest('[data-booking-close]')){e.preventDefault();closeBooking();return;}
    const modal=e.target.closest('[data-booking-modal]');if(modal&&e.target===modal)closeBooking();
  });
  document.addEventListener('change',e=>{
    const modal=e.target.closest('[data-booking-modal]');if(!modal)return;
    if(e.target.matches('#cc-book-service'))updateSelected(modal);
    if(e.target.matches('[data-service-booking-form] input[name="fulfillment"]'))updateHandoverFields(modal);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const p=document.querySelector('[data-booking-update-popup].is-open');if(p)closeUpdatePopup();else closeBooking();}});
  function ensureUpdatePopup(){
    let popup=document.querySelector('[data-booking-update-popup]');
    if(popup)return popup;
    popup=document.createElement('div');
    popup.className='cc-booking-update-popup';
    popup.setAttribute('data-booking-update-popup','');
    popup.setAttribute('aria-hidden','true');
    popup.innerHTML=`<div class="cc-booking-update-card" role="status" aria-live="polite" aria-atomic="true">
      <button type="button" class="cc-booking-update-close" data-booking-update-close aria-label="Close booking update">×</button>
      <span class="cc-booking-update-icon" aria-hidden="true">✓</span>
      <span class="chip">Booking updated</span>
      <h3 class="display">Your service is booked</h3>
      <p data-booking-update-message>Your booking was saved successfully.</p>
      <div class="cc-booking-update-ref"><span>Booking reference</span><strong data-booking-update-ref>—</strong></div>
      <button type="button" class="btn btn-primary" data-booking-update-continue>Book another service</button>
    </div>`;
    document.body.appendChild(popup);
    return popup;
  }
  function showUpdatePopup(booking){
    const popup=ensureUpdatePopup();
    const message=popup.querySelector('[data-booking-update-message]');
    const ref=popup.querySelector('[data-booking-update-ref]');
    if(message)message.textContent=`${booking.serviceName} was requested for ${booking.date}. A fresh booking form is ready for your next request.`;
    if(ref)ref.textContent=booking.reference;
    popup.classList.add('is-open');popup.setAttribute('aria-hidden','false');
    setTimeout(()=>popup.querySelector('[data-booking-update-continue]')?.focus(),40);
  }
  function closeUpdatePopup(focusForm=true){
    const popup=document.querySelector('[data-booking-update-popup]');
    if(!popup)return;
    popup.classList.remove('is-open');popup.setAttribute('aria-hidden','true');
    if(focusForm){const modal=document.querySelector('[data-booking-modal].is-open');modal?.querySelector('#cc-book-service')?.focus();}
  }
  function resetBookingForm(form){
    const modal=form.closest('[data-booking-modal]');
    form.reset();
    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    const select=form.querySelector('#cc-book-service');if(select)select.value='';
    const store=form.querySelector('input[name="fulfillment"][value="store"]');if(store)store.checked=true;
    const address=form.querySelector('#cc-book-address');if(address){address.value='';address.required=false;}
    const success=form.querySelector('[data-booking-success]');if(success){success.classList.remove('is-visible');success.innerHTML='';}
    const btn=form.querySelector('button[type="submit"]');if(btn){btn.disabled=false;btn.textContent='Book Service';}
    activeSlug='';
    if(modal){updateSelected(modal);updateHandoverFields(modal);setMinDate(modal);}
    const body=modal?.querySelector('.cc-booking-body');if(body)body.scrollTop=0;
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-booking-update-close]')){e.preventDefault();closeUpdatePopup();return;}
    if(e.target.closest('[data-booking-update-continue]')){e.preventDefault();closeUpdatePopup();return;}
    const popup=e.target.closest('[data-booking-update-popup]');if(popup&&e.target===popup)closeUpdatePopup();
  });
  document.addEventListener('submit',e=>{
    const form=e.target.closest('[data-service-booking-form]');if(!form)return;e.preventDefault();
    if(!form.reportValidity())return;
    try{
      const booking=saveBooking(form);
      resetBookingForm(form);
      showUpdatePopup(booking);
    }catch(err){
      const success=form.querySelector('[data-booking-success]');success.textContent='Please choose a service and complete the required details.';success.classList.add('is-visible');
    }
  });
  document.addEventListener('DOMContentLoaded',()=>{
    // Dynamic hero pages also inherit the centered hero system.
    document.querySelectorAll('main > section:first-child').forEach(sec=>{if(sec.querySelector('h1'))sec.classList.add('cc-pro-hero','cc-final-centered-hero');});
    const p=new URLSearchParams(location.search),slug=p.get('service');if(p.get('book')==='1')setTimeout(()=>openBooking(slug||''),160);
  });
  window.CobblerCraftBooking={open:openBooking,close:closeBooking};
})();
