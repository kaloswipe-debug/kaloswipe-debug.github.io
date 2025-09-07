// Smooth scroll for <a data-smooth href="#section-id">
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[data-smooth][href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const start = window.scrollY;
      const end = start + target.getBoundingClientRect().top;
      const duration = 900;
      let t0 = null;
      const ease = t => t < .5 ? 8*t*t*t*t : 1 - Math.pow(-2*t + 2, 4)/2;
      const step = ts => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / duration, 1);
        window.scrollTo(0, start + (end - start) * ease(p));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
});

// FAQ accordion (expects .accordion markup)
(function(){
  function updateMobileLabels(){
    if(window.innerWidth<=600){
      document.querySelectorAll('.question').forEach(q=>{
        const t=q.getAttribute('data-text'); if(t) q.textContent=t;
      });
    }else{
      document.querySelectorAll('.question').forEach((q,i)=>{
        const t=q.getAttribute('data-text'); if(t) q.textContent=(i+1)+". "+t;
      });
    }
  }
  function initAccordions(){
    const acc = document.querySelectorAll('.accordion');
    acc.forEach(el=>{
      const icon=el.querySelector('.icon');
      const wrap=el.querySelector('.extra-content');
      const inner=el.querySelector('.inner');
      el.addEventListener('click',()=>{
        const active=el.classList.contains('active');
        acc.forEach(o=>{
          if(o!==el){
            o.classList.remove('active');
            const io=o.querySelector('.icon'), wo=o.querySelector('.extra-content');
            if(io){io.textContent='+'; io.classList.remove('rotate');}
            if(wo){wo.style.maxHeight=null;}
          }
        });
        el.classList.toggle('active');
        if(icon){icon.textContent=active?'+':'–'; icon.classList.toggle('rotate');}
        if(wrap && inner){wrap.style.maxHeight=active?null:inner.scrollHeight+'px';}
      });
    });
  }
  window.addEventListener('resize', updateMobileLabels);
  document.addEventListener('DOMContentLoaded', ()=>{ updateMobileLabels(); initAccordions(); });
})();
