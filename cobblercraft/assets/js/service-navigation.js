// Make every service card consistently open its own service detail page.
(function(){
  'use strict';
  const detailUrl=slug=>'service-details.html?service='+encodeURIComponent(slug);

  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-service-slug]').forEach(card=>{
      const slug=card.getAttribute('data-service-slug');
      if(!slug)return;
      card.classList.add('cc-service-clickable');
      if(!card.hasAttribute('tabindex'))card.setAttribute('tabindex','0');
      if(!card.hasAttribute('role'))card.setAttribute('role','link');
      card.setAttribute('aria-label','Open '+(card.querySelector('h2,h3,h4')?.textContent.trim()||'service')+' details');
      card.addEventListener('click',e=>{
        if(e.target.closest('a,button,input,select,textarea,label'))return;
        window.location.href=detailUrl(slug);
      });
      card.addEventListener('keydown',e=>{
        if((e.key==='Enter'||e.key===' ')&&!e.target.closest('a,button,input,select,textarea')){
          e.preventDefault();
          window.location.href=detailUrl(slug);
        }
      });
    });
  });
})();
