// CobblerCraft authenticated in-page service booking for static HTML demo.
(function(){
  'use strict';
  const SERVICES={
    'sole-replacement':'Sole Replacement','heel-repair':'Heel Repair','leather-polishing':'Leather Polishing',
    'stitching-seams':'Stitching & Seams','leather-restoration':'Leather Restoration','wax-creaming':'Wax & Creaming',
    'leather-care':'Leather Care','orthopaedic-work':'Orthopaedic Work'
  };
  const BOOKINGS_KEY='cc-service-bookings-v1';
  const USERS_KEY='cc-auth-users-v1';
  const SESSION_KEY='cc-auth-session-v1';
  const PENDING_KEY='cc-pending-booking-v1';
  let activeSlug='';

  function session(){
    for(const store of [localStorage,sessionStorage]){
      try{const raw=store.getItem(SESSION_KEY);if(raw)return JSON.parse(raw);}catch(e){}
    }
    return null;
  }
  function users(){try{const d=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');return Array.isArray(d)?d:[];}catch{return[];}}
  function currentUser(s){return users().find(u=>u.id===s?.id)||users().find(u=>(u.email||'').toLowerCase()===(s?.email||'').toLowerCase())||s;}
  function rememberPending(slug){
    const pending={slug,returnUrl:'service-details.html?service='+encodeURIComponent(slug)+'&book=1',createdAt:new Date().toISOString()};
    localStorage.setItem(PENDING_KEY,JSON.stringify(pending));
    return pending;
  }
  function makeGate(){
    const wrap=document.createElement('div');
    wrap.className='cc-booking-modal cc-auth-gate-modal';
    wrap.setAttribute('data-auth-gate','');
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML=`<div class="cc-booking-dialog cc-auth-gate-dialog" role="dialog" aria-modal="true" aria-labelledby="cc-auth-gate-title">
      <div class="cc-booking-head"><div><span class="chip">Account required</span><h2 class="display mt-3 text-2xl font-bold" id="cc-auth-gate-title">Sign in or create an account to continue</h2><p class="muted mt-2 text-sm">Service bookings are saved to your personal profile and booking history, so please choose one of the options below.</p></div></div>
      <div class="cc-booking-body"><div class="cc-booking-selected"><div><span class="muted block text-xs uppercase tracking-wider">Selected service</span><strong data-auth-gate-service>Service</strong></div><span class="chip">Saved</span></div>
      <p class="muted mt-4 text-sm">This popup will stay open until you choose Create Account or Sign In. Your selected service is saved and will be restored after authentication.</p>
      <div class="mt-5 flex flex-wrap gap-3"><a class="btn btn-primary" data-auth-gate-register href="register.html">Create account</a><a class="btn btn-ghost" data-auth-gate-login href="login.html">I already have an account</a></div></div>
    </div>`;
    document.body.appendChild(wrap);
    return wrap;
  }
  function showAuthGate(slug){
    if(!SERVICES[slug])return;
    const pending=rememberPending(slug);
    const gate=document.querySelector('[data-auth-gate]')||makeGate();
    gate.querySelector('[data-auth-gate-service]').textContent=SERVICES[slug];
    gate.querySelector('[data-auth-gate-register]').href='register.html?booking=required&service='+encodeURIComponent(slug);
    gate.querySelector('[data-auth-gate-login]').href='login.html?booking=required&service='+encodeURIComponent(slug);
    gate.classList.add('is-open');gate.setAttribute('aria-hidden','false');document.body.classList.add('cc-modal-open');
  }
  function closeAuthGate(){
    const gate=document.querySelector('[data-auth-gate]');if(!gate)return;
    gate.classList.remove('is-open');gate.setAttribute('aria-hidden','true');document.body.classList.remove('cc-modal-open');
  }
  function makeModal(){
    const wrap=document.createElement('div');
    wrap.className='cc-booking-modal';
    wrap.setAttribute('data-booking-modal','');
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML=`<div class="cc-booking-dialog" role="dialog" aria-modal="true" aria-labelledby="cc-booking-title">
      <div class="cc-booking-head"><div><span class="chip">Service booking</span><h2 class="display mt-3 text-2xl font-bold" id="cc-booking-title">Book selected service</h2><p class="muted mt-1 text-sm">This request will be saved to your profile booking history.</p></div><button class="cc-booking-close" type="button" data-booking-close aria-label="Close booking">×</button></div>
      <div class="cc-booking-body">
        <div class="cc-booking-selected"><div><span class="muted block text-xs uppercase tracking-wider">Selected service</span><strong data-booking-service-name>Service</strong></div><span class="chip">Selected</span></div>
        <form data-service-booking-form>
          <input type="hidden" name="service" data-booking-service-value>
          <div class="cc-booking-grid">
            <div><label class="mb-1.5 block text-sm font-medium" for="cc-book-name">Full name</label><input class="input" id="cc-book-name" name="name" required minlength="2" autocomplete="name"></div>
            <div><label class="mb-1.5 block text-sm font-medium" for="cc-book-email">Account email</label><input class="input" id="cc-book-email" name="email" type="email" required readonly></div>
            <div><label class="mb-1.5 block text-sm font-medium" for="cc-book-phone">Phone</label><input class="input" id="cc-book-phone" name="phone" type="tel" required autocomplete="tel" pattern="[0-9+()\\- ]{7,20}"></div>
            <div><label class="mb-1.5 block text-sm font-medium" for="cc-book-date">Preferred date</label><input class="input" id="cc-book-date" name="date" type="date" required></div>
            <div class="cc-full"><label class="mb-1.5 block text-sm font-medium" for="cc-book-notes">Repair notes</label><textarea class="input" id="cc-book-notes" name="notes" rows="4" placeholder="Tell us about the damage, shoe brand or any special request."></textarea></div>
          </div>
          <label class="mt-4 flex items-start gap-3 text-sm"><input class="mt-1" name="consent" type="checkbox" required><span class="muted">I agree to be contacted about this service booking.</span></label>
          <div class="mt-5 flex flex-wrap gap-3"><button class="btn btn-primary" type="submit">Confirm booking</button><button class="btn btn-ghost" type="button" data-booking-close>Cancel</button><a class="btn btn-ghost" href="profile.html">My profile</a></div>
          <div class="cc-booking-success" data-booking-success role="status"></div>
        </form>
      </div></div>`;
    document.body.appendChild(wrap);
    return wrap;
  }
  function getModal(){return document.querySelector('[data-booking-modal]')||makeModal();}
  function openBooking(slug){
    if(!SERVICES[slug])return;
    const s=session();
    if(!s){showAuthGate(slug);return;}
    activeSlug=slug;
    const u=currentUser(s)||s;
    const modal=getModal();
    modal.querySelector('[data-booking-service-name]').textContent=SERVICES[slug];
    modal.querySelector('[data-booking-service-value]').value=slug;
    const success=modal.querySelector('[data-booking-success]');success.classList.remove('is-visible');success.textContent='';
    const date=modal.querySelector('#cc-book-date');
    const today=new Date(); const y=today.getFullYear(),m=String(today.getMonth()+1).padStart(2,'0'),d=String(today.getDate()).padStart(2,'0');
    date.min=`${y}-${m}-${d}`;
    modal.querySelector('#cc-book-name').value=[u.firstName,u.lastName].filter(Boolean).join(' ')||'';
    modal.querySelector('#cc-book-email').value=s.email||u.email||'';
    modal.querySelector('#cc-book-phone').value=u.phone||'';
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('cc-modal-open');
    setTimeout(()=>modal.querySelector(u.phone?'#cc-book-date':'#cc-book-phone').focus(),60);
  }
  function closeBooking(){const modal=document.querySelector('[data-booking-modal]');if(!modal)return;modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('cc-modal-open');}
  function saveBooking(form){
    const s=session();if(!s)throw new Error('AUTH_REQUIRED');
    const data=Object.fromEntries(new FormData(form).entries());
    const ref='CC-'+Date.now().toString(36).toUpperCase().slice(-7);
    const booking={reference:ref,userId:s.id||'',serviceSlug:activeSlug,serviceName:SERVICES[activeSlug],name:data.name,email:s.email||data.email,phone:data.phone,date:data.date,notes:data.notes||'',createdAt:new Date().toISOString(),status:'Requested'};
    let list=[];try{list=JSON.parse(localStorage.getItem(BOOKINGS_KEY)||'[]');if(!Array.isArray(list))list=[];}catch(e){list=[];}
    list.push(booking);localStorage.setItem(BOOKINGS_KEY,JSON.stringify(list));return booking;
  }
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('[data-book-service],[data-service-book]');
    if(trigger){e.preventDefault();const slug=trigger.getAttribute('data-book-service')||trigger.closest('[data-service-slug]')?.getAttribute('data-service-slug')||new URLSearchParams(location.search).get('service');openBooking(slug);return;}
    if(e.target.closest('[data-booking-close]')){e.preventDefault();closeBooking();return;}
    const modal=e.target.closest('[data-booking-modal]');if(modal&&e.target===modal)closeBooking();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeBooking();}});
  document.addEventListener('submit',e=>{
    const form=e.target.closest('[data-service-booking-form]');if(!form)return;e.preventDefault();if(!form.reportValidity())return;
    if(!session()){closeBooking();showAuthGate(activeSlug);return;}
    const booking=saveBooking(form);localStorage.removeItem(PENDING_KEY);
    const success=form.querySelector('[data-booking-success]');success.textContent=`Booking requested for ${booking.serviceName}. Reference: ${booking.reference}. View it anytime in My Profile.`;success.classList.add('is-visible');
    const btn=form.querySelector('button[type="submit"]');btn.disabled=true;const old=btn.textContent;btn.textContent='Booked ✓';
    setTimeout(()=>{btn.disabled=false;btn.textContent=old;form.reset();closeBooking();window.location.href='profile.html?booking='+encodeURIComponent(booking.reference);},1600);
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const params=new URLSearchParams(location.search);
    const slug=params.get('service');
    if(params.get('book')==='1'&&slug&&SERVICES[slug])setTimeout(()=>openBooking(slug),180);
  });
})();
