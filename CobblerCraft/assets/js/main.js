// CobblerCraft template scripts
(function(){
  const root=document.documentElement;
  const saved=localStorage.getItem('cc-theme');
  if(saved==='dark'||(!saved&&window.matchMedia('(prefers-color-scheme: dark)').matches))root.classList.add('dark');
  if(localStorage.getItem('cc-dir')==='rtl')root.setAttribute('dir','rtl');
  window.ccToggleTheme=function(){
    document.body&&document.body.classList.add('cc-theme-switch');
    root.classList.toggle('dark');
    localStorage.setItem('cc-theme',root.classList.contains('dark')?'dark':'light');
    setTimeout(()=>document.body&&document.body.classList.remove('cc-theme-switch'),360);
  };
  window.ccToggleDir=function(){const rtl=root.getAttribute('dir')==='rtl';
    root.setAttribute('dir',rtl?'ltr':'rtl');localStorage.setItem('cc-dir',rtl?'ltr':'rtl');
    document.body&&document.body.classList.add('cc-theme-switch');
    setTimeout(()=>document.body&&document.body.classList.remove('cc-theme-switch'),360);
  };
  document.addEventListener('DOMContentLoaded',function(){
    requestAnimationFrame(()=>document.body.classList.add('cc-page-ready'));

    // Respect reduced-motion preferences for the remaining click/page animations.
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Highlight the page currently open in the footer (and matching primary nav link when present).
    const cleanFile=value=>{
      try{
        const u=new URL(value,location.href);
        let file=(u.pathname.split('/').pop()||'index.html').toLowerCase();
        if(!file)file='index.html';
        return file;
      }catch{return '';}
    };
    const currentFile=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    document.querySelectorAll('body > footer a[href]').forEach(link=>{
      const href=link.getAttribute('href')||'';
      if(!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:'))return;
      if(cleanFile(link.href)===currentFile){
        link.classList.add('cc-footer-active');
        link.setAttribute('aria-current','page');
      }
    });
    document.querySelectorAll('header nav a[href]').forEach(link=>{
      if(cleanFile(link.href)===currentFile){link.classList.add('cc-nav-active');link.setAttribute('aria-current','page');}
    });

    // Consistent scroll-in animation for sections, cards, media, forms and tables.
    const motionTargets=[...new Set(document.querySelectorAll('main > section, main .card, main .stitch, main .cc-feature-photo-wrap, main .cc-hero-photo-wrap, main .cc-service-hero-wrap, main form, main table'))];
    motionTargets.forEach((el,i)=>{el.classList.add('cc-motion-item');el.style.animationDelay=((i%5)*55)+'ms';});
    const motionObserver=('IntersectionObserver' in window)?new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('cc-motion-in');motionObserver.unobserve(entry.target);}
    }),{threshold:.08,rootMargin:'0px 0px -35px 0px'}):null;
    motionTargets.forEach(el=>motionObserver?motionObserver.observe(el):el.classList.add('cc-motion-in'));

    // Give every user action a tactile pulse + pointer-positioned ripple.
    document.addEventListener('click',e=>{
      const action=e.target.closest('a,button,summary,[role="button"],[data-filter],[data-sfilter],[data-service-faq-btn]');
      if(!action)return;
      action.classList.remove('cc-action-pulse');
      void action.offsetWidth;
      action.classList.add('cc-action-pulse');
      setTimeout(()=>action.classList.remove('cc-action-pulse'),280);

      if(!reduceMotion && action.matches('.btn,button,summary,.auth-signin-link,.auth-profile-summary,[data-filter],[data-sfilter],[data-service-faq-btn]')){
        action.classList.add('cc-ripple-host');
        const rect=action.getBoundingClientRect();
        const ripple=document.createElement('span');
        ripple.className='cc-click-ripple';
        ripple.setAttribute('aria-hidden','true');
        ripple.style.left=((e.clientX||rect.left+rect.width/2)-rect.left)+'px';
        ripple.style.top=((e.clientY||rect.top+rect.height/2)-rect.top)+'px';
        action.appendChild(ripple);
        setTimeout(()=>ripple.remove(),680);
      }

      if(action.tagName==='A' && !e.defaultPrevented && e.button===0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !action.target && !action.hasAttribute('download')){
        const raw=action.getAttribute('href')||'';
        if(raw && !raw.startsWith('#') && !raw.startsWith('mailto:') && !raw.startsWith('tel:') && !raw.startsWith('javascript:')){
          const url=new URL(action.href,location.href);
          const samePlace=(url.origin===location.origin)||(url.protocol==='file:'&&location.protocol==='file:');
          if(samePlace && /\.html(?:$|[?#])/.test(raw)){
            e.preventDefault();document.body.classList.add('cc-page-leave');setTimeout(()=>{location.href=action.href;},180);
          }
        }
      }
    });
    document.addEventListener('change',e=>{
      const control=e.target.closest('select,input[type="checkbox"],input[type="radio"]');
      if(!control)return;
      control.classList.remove('cc-control-glow');void control.offsetWidth;control.classList.add('cc-control-glow');
      setTimeout(()=>control.classList.remove('cc-control-glow'),500);
    });
    const btn=document.querySelector('[data-mobile-toggle]');
    const menu=document.querySelector('[data-mobile-menu]');
    if(btn&&menu)btn.addEventListener('click',()=>{const opening=menu.classList.contains('hidden');menu.classList.toggle('hidden');if(opening){menu.classList.remove('cc-filter-in');void menu.offsetWidth;menu.classList.add('cc-filter-in');}});
    // Close the desktop Home dropdown when the user clicks elsewhere or presses Escape.
    const homeDropdowns=document.querySelectorAll('.nav-home-dropdown');
    document.addEventListener('click',e=>homeDropdowns.forEach(d=>{if(d.open&&!d.contains(e.target))d.removeAttribute('open');}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')homeDropdowns.forEach(d=>d.removeAttribute('open'));});
    document.querySelectorAll('[data-accordion] > button').forEach(b=>{
      b.addEventListener('click',()=>{const p=b.parentElement;p.classList.toggle('open');
        const body=p.querySelector('[data-accordion-body]');if(body)body.classList.toggle('hidden');});
    });
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
    // Blog filter, search and smart pagination.
    // Pagination stays hidden while the filtered result fits on one page.
    const q=document.querySelector('[data-blog-search]');
    const filterBtns=document.querySelectorAll('[data-filter]');
    const posts=Array.from(document.querySelectorAll('[data-post]'));
    const pagination=document.querySelector('[data-blog-pagination]');
    const BLOG_PAGE_SIZE=6;
    let blogPage=1;

    function getFilteredPosts(){
      const term=(q&&q.value||'').trim().toLowerCase();
      const active=document.querySelector('[data-filter].is-active');
      const cat=active?active.getAttribute('data-filter'):'all';
      return posts.filter(p=>{
        const okCat=cat==='all'||p.getAttribute('data-cat')===cat;
        const okTerm=!term||p.innerText.toLowerCase().includes(term);
        return okCat&&okTerm;
      });
    }

    function renderBlogPagination(totalPages){
      if(!pagination)return;
      pagination.innerHTML='';
      if(totalPages<=1){
        pagination.classList.add('hidden');
        pagination.classList.remove('flex');
        return;
      }
      pagination.classList.remove('hidden');
      pagination.classList.add('flex');
      const makeBtn=(label,page,active=false,disabled=false)=>{
        const b=document.createElement('button');
        b.type='button';
        b.className='btn '+(active?'btn-primary':'btn-ghost');
        b.textContent=label;
        b.disabled=disabled;
        if(disabled)b.setAttribute('aria-disabled','true');
        if(active)b.setAttribute('aria-current','page');
        b.addEventListener('click',()=>{
          if(disabled||page===blogPage)return;
          blogPage=page;
          renderBlogList();
          const grid=document.querySelector('.blog-card-grid');
          if(grid)grid.scrollIntoView({behavior:'smooth',block:'start'});
        });
        return b;
      };
      pagination.appendChild(makeBtn('←',Math.max(1,blogPage-1),false,blogPage===1));
      for(let i=1;i<=totalPages;i++)pagination.appendChild(makeBtn(String(i),i,i===blogPage,false));
      pagination.appendChild(makeBtn('→',Math.min(totalPages,blogPage+1),false,blogPage===totalPages));
    }

    function renderBlogList(){
      if(!posts.length)return;
      const filtered=getFilteredPosts();
      const totalPages=Math.max(1,Math.ceil(filtered.length/BLOG_PAGE_SIZE));
      if(blogPage>totalPages)blogPage=totalPages;
      const start=(blogPage-1)*BLOG_PAGE_SIZE;
      const visible=new Set(filtered.slice(start,start+BLOG_PAGE_SIZE));
      posts.forEach(p=>{const show=visible.has(p);p.style.display=show?'':'none';if(show){p.classList.remove('cc-filter-in');void p.offsetWidth;p.classList.add('cc-filter-in');}});
      renderBlogPagination(Math.ceil(filtered.length/BLOG_PAGE_SIZE));
    }

    if(q)q.addEventListener('input',()=>{blogPage=1;renderBlogList();});
    filterBtns.forEach(b=>b.addEventListener('click',()=>{
      filterBtns.forEach(x=>{x.classList.remove('is-active','btn-primary');x.classList.add('btn-ghost');});
      b.classList.add('is-active','btn-primary');b.classList.remove('btn-ghost');
      blogPage=1;
      renderBlogList();
    }));
    renderBlogList();
    // service filter
    const sBtns=document.querySelectorAll('[data-sfilter]');
    const sItems=document.querySelectorAll('[data-service]');
    sBtns.forEach(b=>b.addEventListener('click',()=>{
      sBtns.forEach(x=>{x.classList.remove('is-active','btn-primary');x.classList.add('btn-ghost')});
      b.classList.add('is-active','btn-primary');b.classList.remove('btn-ghost');
      const c=b.getAttribute('data-sfilter');
      sItems.forEach(i=>{const show=(c==='all'||i.getAttribute('data-cat')===c);i.style.display=show?'':'none';if(show){i.classList.remove('cc-filter-in');void i.offsetWidth;i.classList.add('cc-filter-in');}});
    }));
    // forms (demo only)
    document.querySelectorAll('form[data-demo]').forEach(f=>f.addEventListener('submit',e=>{
      e.preventDefault();const n=f.querySelector('[data-demo-note]');
      if(n){n.classList.remove('hidden');}
    }));
    // dashboard sidebar
    const sb=document.querySelector('[data-sidebar]');
    const sbT=document.querySelector('[data-sidebar-toggle]');
    if(sb&&sbT)sbT.addEventListener('click',()=>sb.classList.toggle('hidden'));
  });
})();
