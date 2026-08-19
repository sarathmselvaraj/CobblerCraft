// CobblerCraft front-end demo authentication.
// Uses browser storage so the static HTML template can be tested without a backend.
(function(){
  'use strict';

  const USERS_KEY='cc-auth-users-v1';
  const SESSION_KEY='cc-auth-session-v1';
  const PENDING_KEY='cc-pending-booking-v1';
  const DEMO_USER={
    id:'cc-demo-user',
    firstName:'Demo',
    lastName:'Customer',
    email:'demo@cobblercraft.com',
    password:'Demo1234',
    createdAt:'2026-08-07T00:00:00.000Z'
  };

  const $=(s,root=document)=>root.querySelector(s);
  const normalizeEmail=v=>(v||'').trim().toLowerCase();
  const getUsers=()=>{
    try{const data=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');return Array.isArray(data)?data:[];}catch{return [];}
  };
  const saveUsers=users=>localStorage.setItem(USERS_KEY,JSON.stringify(users));

  function ensureDemoUser(){
    const users=getUsers();
    if(!users.some(u=>normalizeEmail(u.email)===DEMO_USER.email)){
      users.push(DEMO_USER);
      saveUsers(users);
    }
  }

  function setSession(user,remember){
    const session={id:user.id,email:user.email,firstName:user.firstName,lastName:user.lastName,loginAt:new Date().toISOString()};
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (remember?localStorage:sessionStorage).setItem(SESSION_KEY,JSON.stringify(session));
  }

  function getSession(){
    const raw=localStorage.getItem(SESSION_KEY)||sessionStorage.getItem(SESSION_KEY);
    if(!raw)return null;
    try{return JSON.parse(raw);}catch{return null;}
  }

  function clearSession(){
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function getPendingBooking(){
    try{const p=JSON.parse(localStorage.getItem(PENDING_KEY)||'null');return p&&p.slug?p:null;}catch{return null;}
  }
  function consumePendingBooking(){
    const p=getPendingBooking();
    if(p)localStorage.removeItem(PENDING_KEY);
    return p;
  }
  function authSuccessDestination(){
    const p=consumePendingBooking();
    if(p&&p.returnUrl)return p.returnUrl;
    const profileReturn=localStorage.getItem('cc-profile-return');
    if(profileReturn){localStorage.removeItem('cc-profile-return');return profileReturn;}
    return 'index.html';
  }

  function showStatus(el,message,type='info'){
    if(!el)return;
    el.textContent=message;
    el.className='auth-status is-'+type;
    el.removeAttribute('hidden');
  }

  function clearStatus(el){
    if(!el)return;
    el.setAttribute('hidden','');
    el.textContent='';
  }

  function setFieldError(input,message){
    const wrap=input&&input.closest('[data-field]');
    if(!wrap)return;
    const error=$('[data-field-error]',wrap);
    input.setAttribute('aria-invalid',message?'true':'false');
    input.classList.toggle('auth-input-error',Boolean(message));
    if(error){error.textContent=message||'';error.toggleAttribute('hidden',!message);}
  }

  function validateEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);}
  function validatePassword(password){
    return password.length>=8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
  }

  function attachPasswordToggles(){
    document.querySelectorAll('[data-password-toggle]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.getAttribute('data-password-toggle');
        const input=document.getElementById(id);
        if(!input)return;
        const showing=input.type==='text';
        input.type=showing?'password':'text';
        btn.textContent=showing?'Show':'Hide';
        btn.setAttribute('aria-label',(showing?'Show':'Hide')+' password');
      });
    });
  }

  function initRegister(){
    const form=$('#register-form');
    if(!form)return;
    const status=$('#register-status');
    const first=$('#r-f'),last=$('#r-l'),email=$('#r-e'),phone=$('#r-phone'),password=$('#r-p'),confirm=$('#r-c'),terms=$('#r-terms');

    [first,last,email,password,confirm].forEach(input=>input.addEventListener('input',()=>setFieldError(input,'')));

    form.addEventListener('submit',e=>{
      e.preventDefault();
      clearStatus(status);
      let valid=true;
      const firstName=first.value.trim();
      const lastName=last.value.trim();
      const mail=normalizeEmail(email.value);
      const pwd=password.value;
      const cpwd=confirm.value;

      if(firstName.length<2){setFieldError(first,'Enter at least 2 characters.');valid=false;}
      if(lastName.length<2){setFieldError(last,'Enter at least 2 characters.');valid=false;}
      if(!validateEmail(mail)){setFieldError(email,'Enter a valid email address.');valid=false;}
      if(!validatePassword(pwd)){setFieldError(password,'Use 8+ characters with uppercase, lowercase and a number.');valid=false;}
      if(cpwd!==pwd){setFieldError(confirm,'Passwords do not match.');valid=false;}
      if(!terms.checked){showStatus(status,'Please accept the Terms of Service and Privacy Policy.','error');valid=false;}
      if(!valid)return;

      const users=getUsers();
      if(users.some(u=>normalizeEmail(u.email)===mail)){
        setFieldError(email,'An account already exists for this email.');
        showStatus(status,'That email is already registered. Sign in instead.','error');
        return;
      }

      const user={id:'cc-'+Date.now(),firstName,lastName,email:mail,phone:phone?phone.value.trim():'',address:'',city:'',postcode:'',password:pwd,createdAt:new Date().toISOString()};
      users.push(user);
      saveUsers(users);
      setSession(user,true);
      showStatus(status,'Account created successfully. Your profile is ready.','success');
      form.querySelector('button[type="submit"]').disabled=true;
      setTimeout(()=>{const dest=authSuccessDestination();window.location.href=dest+(dest.includes('?')?'&':'?')+'account=created';},650);
    });
  }

  function initLogin(){
    const form=$('#login-form');
    if(!form)return;
    const status=$('#login-status');
    const email=$('#l-e'),password=$('#l-p'),remember=$('#l-remember');
    const demoBtn=$('[data-demo-login]');
    const forgotToggle=$('[data-forgot-toggle]');
    const resetPanel=$('#reset-panel');
    const resetForm=$('#reset-form');
    const resetStatus=$('#reset-status');

    [email,password].forEach(input=>input.addEventListener('input',()=>setFieldError(input,'')));

    form.addEventListener('submit',e=>{
      e.preventDefault();
      clearStatus(status);
      const mail=normalizeEmail(email.value);
      const pwd=password.value;
      let valid=true;
      if(!validateEmail(mail)){setFieldError(email,'Enter a valid email address.');valid=false;}
      if(!pwd){setFieldError(password,'Enter your password.');valid=false;}
      if(!valid)return;
      const user=getUsers().find(u=>normalizeEmail(u.email)===mail && u.password===pwd);
      if(!user){
        showStatus(status,'Email or password is incorrect. Please try again.','error');
        return;
      }
      setSession(user,remember.checked);
      showStatus(status,'Sign in successful. Welcome back!','success');
      form.querySelector('button[type="submit"]').disabled=true;
      setTimeout(()=>{const dest=authSuccessDestination();window.location.href=dest+(dest.includes('?')?'&':'?')+'login=success';},500);
    });

    if(demoBtn)demoBtn.addEventListener('click',()=>{
      email.value=DEMO_USER.email;
      password.value=DEMO_USER.password;
      remember.checked=true;
      clearStatus(status);
      showStatus(status,'Demo account loaded. Click “Sign in” to continue.','info');
    });

    if(forgotToggle&&resetPanel){
      forgotToggle.addEventListener('click',()=>{
        resetPanel.classList.toggle('hidden');
        const resetEmail=$('#reset-email');
        if(resetEmail&&!resetEmail.value)resetEmail.value=email.value;
      });
    }

    if(resetForm){
      resetForm.addEventListener('submit',e=>{
        e.preventDefault();
        clearStatus(resetStatus);
        const resetEmail=$('#reset-email');
        const resetPassword=$('#reset-password');
        const resetConfirm=$('#reset-confirm');
        const mail=normalizeEmail(resetEmail.value);
        const pwd=resetPassword.value;
        if(!validateEmail(mail)){showStatus(resetStatus,'Enter the registered email address.','error');return;}
        if(!validatePassword(pwd)){showStatus(resetStatus,'New password needs 8+ characters, uppercase, lowercase and a number.','error');return;}
        if(pwd!==resetConfirm.value){showStatus(resetStatus,'New passwords do not match.','error');return;}
        const users=getUsers();
        const user=users.find(u=>normalizeEmail(u.email)===mail);
        if(!user){showStatus(resetStatus,'No account was found for that email.','error');return;}
        user.password=pwd;
        saveUsers(users);
        resetForm.reset();
        showStatus(resetStatus,'Password updated. You can sign in with the new password.','success');
      });
    }
  }

  function renderGlobalAuth(){
    const session=getSession();
    const guestEls=[...document.querySelectorAll('[data-auth-guest]')];
    const userEls=[...document.querySelectorAll('[data-auth-user]')];
    const nameEls=[...document.querySelectorAll('[data-auth-name]')];
    const fullNameEls=[...document.querySelectorAll('[data-auth-fullname]')];
    const emailEls=[...document.querySelectorAll('[data-auth-email]')];
    const initialEls=[...document.querySelectorAll('[data-auth-initial]')];
    const logoutBtns=[...document.querySelectorAll('[data-auth-logout]')];
    const signInEls=[...document.querySelectorAll('[data-auth-signin]')];

    if(session){
      const fullName=[session.firstName,session.lastName].filter(Boolean).join(' ')||'CobblerCraft User';
      guestEls.forEach(el=>{el.hidden=true;});
      userEls.forEach(el=>{el.hidden=false;el.classList.remove('hidden');});
      signInEls.forEach(el=>{el.hidden=true;el.classList.add('hidden');});
      nameEls.forEach(el=>el.textContent=session.firstName||fullName);
      fullNameEls.forEach(el=>el.textContent=fullName);
      emailEls.forEach(el=>el.textContent=session.email||'');
      initialEls.forEach(el=>el.textContent=(session.firstName||session.email||'U').charAt(0).toUpperCase());
      logoutBtns.forEach(el=>el.classList.remove('hidden'));
    }else{
      guestEls.forEach(el=>{el.hidden=false;});
      userEls.forEach(el=>{el.hidden=true;});
      signInEls.forEach(el=>{el.hidden=false;el.classList.remove('hidden');});
      nameEls.forEach(el=>el.textContent='Guest Preview');
      fullNameEls.forEach(el=>el.textContent='Guest Preview');
      emailEls.forEach(el=>el.textContent='Sign in to view your profile');
      initialEls.forEach(el=>el.textContent='G');
      logoutBtns.forEach(el=>el.classList.add('hidden'));
    }

    logoutBtns.forEach(btn=>btn.addEventListener('click',()=>{
      clearSession();
      window.location.href='index.html?logout=1';
    }));
  }

  function showPageNotice(){
    const params=new URLSearchParams(window.location.search);
    let message='';
    if(params.get('account')==='created')message='Account created successfully. Your profile is now available in the navigation bar.';
    if(params.get('login')==='success')message='Welcome back! Your profile is now active in the navigation bar.';
    if(params.get('logout')==='1')message='You have been signed out successfully.';
    if(!message)return;
    const toast=document.createElement('div');
    toast.className='auth-page-toast';
    toast.setAttribute('role','status');
    toast.textContent=message;
    document.body.appendChild(toast);
    setTimeout(()=>toast.classList.add('is-visible'),50);
    setTimeout(()=>{toast.classList.remove('is-visible');setTimeout(()=>toast.remove(),250);},4200);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    ensureDemoUser();
    attachPasswordToggles();
    initRegister();
    initLogin();
    renderGlobalAuth();
    showPageNotice();

    const params=new URLSearchParams(window.location.search);
    if(params.get('logout')==='1')showStatus($('#login-status'),'You have been signed out successfully.','success');
    if(params.get('booking')==='required'){
      const service=params.get('service');
      const msg='Please create an account or sign in before booking'+(service?' the selected service':'')+'. Your service selection has been saved.';
      showStatus($('#register-status')||$('#login-status'),msg,'info');
    }
    if(params.get('profile')==='required')showStatus($('#login-status'),'Please sign in to view your profile and booking history.','info');
  });
})();
