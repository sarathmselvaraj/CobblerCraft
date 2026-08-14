// CobblerCraft customer profile + booking history for the static HTML demo.
(function(){
  'use strict';
  const USERS_KEY='cc-auth-users-v1';
  const SESSION_KEY='cc-auth-session-v1';
  const BOOKINGS_KEY='cc-service-bookings-v1';

  const $=(s,r=document)=>r.querySelector(s);
  const getSession=()=>{
    for(const store of [localStorage,sessionStorage]){
      try{const raw=store.getItem(SESSION_KEY);if(raw)return {data:JSON.parse(raw),store};}catch(e){}
    }
    return null;
  };
  const getUsers=()=>{try{const d=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');return Array.isArray(d)?d:[];}catch{return[];}};
  const getBookings=()=>{try{const d=JSON.parse(localStorage.getItem(BOOKINGS_KEY)||'[]');return Array.isArray(d)?d:[];}catch{return[];}};
  const formatDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?v:d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});};
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  document.addEventListener('DOMContentLoaded',()=>{
    if(!document.querySelector('[data-profile-page]'))return;
    const found=getSession();
    if(!found){
      localStorage.setItem('cc-profile-return','profile.html');
      window.location.href='login.html?profile=required';
      return;
    }
    const session=found.data;
    const users=getUsers();
    let user=users.find(u=>u.id===session.id)||users.find(u=>(u.email||'').toLowerCase()===(session.email||'').toLowerCase())||session;

    const full=[user.firstName,user.lastName].filter(Boolean).join(' ')||'CobblerCraft User';
    $('[data-profile-name]').textContent=full;
    $('[data-profile-email]').textContent=user.email||'';
    $('[data-profile-initial]').textContent=(user.firstName||user.email||'U').charAt(0).toUpperCase();
    $('[data-profile-since]').textContent=formatDate(user.createdAt||session.loginAt);
    $('#profile-first').value=user.firstName||'';
    $('#profile-last').value=user.lastName||'';
    $('#profile-email').value=user.email||session.email||'';
    $('#profile-phone').value=user.phone||'';
    $('#profile-address').value=user.address||'';
    $('#profile-city').value=user.city||'';
    $('#profile-postcode').value=user.postcode||'';

    const mine=getBookings().filter(b=>{
      if(b.userId&&session.id)return b.userId===session.id;
      return (b.email||'').toLowerCase()===(session.email||'').toLowerCase();
    }).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    $('[data-profile-booking-count]').textContent=String(mine.length);
    $('[data-profile-active-count]').textContent=String(mine.filter(b=>!['Completed','Cancelled'].includes(b.status)).length);

    const history=$('[data-booking-history]');
    const empty=$('[data-booking-empty]');
    if(!mine.length){empty.hidden=false;history.innerHTML='';}
    else{
      empty.hidden=true;
      history.innerHTML=mine.map(b=>`<article class="cc-history-item">
        <div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h3 class="font-bold">${esc(b.serviceName||'Service')}</h3><span class="cc-booking-status">${esc(b.status||'Requested')}</span></div><p class="muted mt-1 text-sm">Reference ${esc(b.reference||'—')} · Preferred ${esc(formatDate(b.date))}</p><p class="mt-2 text-sm"><strong>Handover:</strong> ${esc(b.handoverMethod||'Store Handover')}</p>${b.pickupAddress?`<p class="muted mt-1 text-sm"><strong>Pickup address:</strong> ${esc(b.pickupAddress)}</p>`:''}${b.notes?`<p class="muted mt-2 text-sm">${esc(b.notes)}</p>`:''}</div>
        <div class="text-start sm:text-end"><p class="text-xs muted">Booked</p><p class="mt-1 text-sm font-semibold">${esc(formatDate(b.createdAt))}</p><a class="link-underline brand mt-2 inline-block text-xs font-semibold" href="service-details.html?service=${encodeURIComponent(b.serviceSlug||'sole-replacement')}">View service</a></div>
      </article>`).join('');
    }

    const form=$('[data-profile-form]');
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const first=$('#profile-first').value.trim();
      const last=$('#profile-last').value.trim();
      if(first.length<2||last.length<2){$('[data-profile-save-status]').textContent='Enter a valid first and last name.';return;}
      const currentUsers=getUsers();
      let idx=currentUsers.findIndex(u=>u.id===session.id);
      if(idx<0)idx=currentUsers.findIndex(u=>(u.email||'').toLowerCase()===(session.email||'').toLowerCase());
      const updated={...(idx>=0?currentUsers[idx]:user),id:session.id||user.id,firstName:first,lastName:last,email:session.email||user.email,phone:$('#profile-phone').value.trim(),address:$('#profile-address').value.trim(),city:$('#profile-city').value.trim(),postcode:$('#profile-postcode').value.trim(),createdAt:user.createdAt||new Date().toISOString()};
      if(idx>=0)currentUsers[idx]=updated;else currentUsers.push(updated);
      localStorage.setItem(USERS_KEY,JSON.stringify(currentUsers));
      const newSession={...session,firstName:first,lastName:last,email:updated.email};
      found.store.setItem(SESSION_KEY,JSON.stringify(newSession));
      $('[data-profile-name]').textContent=[first,last].join(' ');
      $('[data-profile-initial]').textContent=first.charAt(0).toUpperCase();
      document.querySelectorAll('[data-auth-name]').forEach(el=>el.textContent=first);
      document.querySelectorAll('[data-auth-fullname]').forEach(el=>el.textContent=[first,last].join(' '));
      document.querySelectorAll('[data-auth-email]').forEach(el=>el.textContent=updated.email);
      document.querySelectorAll('[data-auth-initial]').forEach(el=>el.textContent=first.charAt(0).toUpperCase());
      const status=$('[data-profile-save-status]');status.textContent='Personal details saved ✓';status.classList.add('is-visible');
      setTimeout(()=>status.classList.remove('is-visible'),2200);
      window.dispatchEvent(new Event('cc-profile-updated'));
    });
  });
})();
