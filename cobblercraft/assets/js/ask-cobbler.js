// CobblerCraft — common Services-page photo assessment (front-end demo).
(function(){
  'use strict';
  const MAX_FILES=3;
  const MAX_BYTES=8*1024*1024;
  const ALLOWED=['image/jpeg','image/png','image/webp'];
  let files=[];
  let objectUrls=[];

  function readSessionEmail(){
    const key='cc-auth-session-v1';
    for(const store of [localStorage,sessionStorage]){
      try{const raw=store.getItem(key);if(raw){const data=JSON.parse(raw);if(data&&data.email)return data.email;}}catch(e){}
    }
    return '';
  }
  function cleanupUrls(){objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls=[];}
  function setStatus(root,message,type){
    const el=root.querySelector('[data-ask-status]');
    if(!el)return;
    el.className='cc-ask-status '+(type==='error'?'is-error':'is-success');
    el.textContent=message;
  }
  function clearStatus(root){const el=root.querySelector('[data-ask-status]');if(el){el.className='cc-ask-status';el.textContent='';}}
  function resetNativeInput(root){
    const input=root.querySelector('[data-ask-photo-input]');
    if(input) input.value='';
  }
  function render(root){
    const preview=root.querySelector('[data-ask-preview]');
    const form=root.querySelector('[data-ask-form]');
    if(!preview||!form)return;
    cleanupUrls();
    preview.innerHTML='';
    if(!files.length){
      preview.hidden=true;
      form.hidden=true;
      clearStatus(root);
      return;
    }
    files.forEach((file,index)=>{
      const url=URL.createObjectURL(file);objectUrls.push(url);
      const item=document.createElement('div');item.className='cc-photo-preview';
      const img=document.createElement('img');img.src=url;img.alt=`Selected repair photo ${index+1} preview`;
      const name=document.createElement('span');name.textContent=file.name;
      const remove=document.createElement('button');
      remove.type='button';
      remove.className='cc-photo-remove';
      remove.setAttribute('data-ask-remove-photo',String(index));
      remove.setAttribute('aria-label',`Remove ${file.name}`);
      remove.innerHTML='<span aria-hidden="true">×</span><span class="cc-photo-remove-text">Remove</span>';
      item.append(img,name,remove);preview.appendChild(item);
    });
    preview.hidden=false;
    form.hidden=false;
    const email=form.querySelector('#ask-email');if(email&&!email.value)email.value=readSessionEmail();
  }
  function acceptFiles(root,list){
    clearStatus(root);
    const incoming=Array.from(list||[]);
    const invalidType=incoming.find(f=>!ALLOWED.includes(f.type));
    if(invalidType){setStatus(root,'Please choose JPG, PNG or WebP photos only.','error');resetNativeInput(root);return;}
    const tooLarge=incoming.find(f=>f.size>MAX_BYTES);
    if(tooLarge){setStatus(root,'Each photo must be 8 MB or smaller.','error');resetNativeInput(root);return;}
    files=incoming.slice(0,MAX_FILES);
    render(root);
    if(incoming.length>MAX_FILES)setStatus(root,'Only the first 3 photos were added. Remove a photo before choosing a different set.','error');
    resetNativeInput(root);
  }
  function removePhoto(root,index){
    if(index<0||index>=files.length)return;
    files.splice(index,1);
    render(root);
    resetNativeInput(root);
    if(files.length){setStatus(root,`${files.length} repair photo${files.length>1?'s':''} selected. You can remove another photo or continue with the assessment.`,'success');}
  }

  document.addEventListener('click',e=>{
    const remove=e.target.closest('[data-ask-remove-photo]');
    if(remove){
      const root=remove.closest('[data-ask-cobbler]');
      removePhoto(root,Number(remove.getAttribute('data-ask-remove-photo')));
      return;
    }
    const trigger=e.target.closest('[data-ask-photo-trigger],[data-ask-change-photos]');
    if(!trigger)return;
    const root=trigger.closest('[data-ask-cobbler]')||document.querySelector('[data-ask-cobbler]');
    root?.querySelector('[data-ask-photo-input]')?.click();
  });

  document.addEventListener('change',e=>{
    if(!e.target.matches('[data-ask-photo-input]'))return;
    const root=e.target.closest('[data-ask-cobbler]');
    if(root){
      acceptFiles(root,e.target.files);
      if(files.length){setTimeout(()=>document.querySelector('#ask-a-cobbler')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}
    }
  });

  document.addEventListener('submit',e=>{
    const form=e.target.closest('[data-ask-form]');if(!form)return;
    e.preventDefault();const root=form.closest('[data-ask-cobbler]');
    clearStatus(root);
    if(!files.length){setStatus(root,'Add at least one repair photo before sending.','error');return;}
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const service=data.get('service')==='not-sure'?'a cobbler recommendation':form.querySelector('#ask-service option:checked')?.textContent||'the selected service';
    setStatus(root,`Assessment request prepared for ${service}. Your ${files.length} photo${files.length>1?'s':''} ${files.length>1?'are':'is'} ready for review. Next, choose the matching service below when you are ready to book. This static template keeps uploaded photos only in your browser.`,'success');
    const btn=form.querySelector('button[type="submit"]');const old=btn.textContent;btn.disabled=true;btn.textContent='Assessment ready ✓';
    setTimeout(()=>{btn.disabled=false;btn.textContent=old;document.querySelector('#services-list')?.scrollIntoView({behavior:'smooth',block:'start'});},1700);
  });
  window.addEventListener('beforeunload',cleanupUrls);
})();
