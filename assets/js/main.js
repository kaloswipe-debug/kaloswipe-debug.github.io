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


// ===== container-3: desktop "no-select" box (prevent select/context menu) =====
(function(){
  const el = document.getElementById("no-select");
  if (!el) return;
  el.addEventListener("contextmenu", e => e.preventDefault());
  el.addEventListener("selectstart", e => e.preventDefault());
})();

// ===== container-3: slideshow =====
(function(){
  const slideshow = document.getElementById("slideshow");
  const track = document.getElementById("slideTrack");
  if (!slideshow || !track) return;

  const IMAGE_URLS = [
    "https://i.imgur.com/M3iYH0R.jpeg",
    "https://i.imgur.com/iTgs8Nm.jpeg",
    "https://i.imgur.com/xqhNrMc.jpeg",
    "https://i.imgur.com/JIZwpKT.jpeg",
    "https://i.imgur.com/kYj36ZY.jpeg",
  ];

  const slides = [];
  IMAGE_URLS.forEach(() => {
    const d = document.createElement("div");
    d.className = "slide";
    track.appendChild(d);
    slides.push(d);
  });
  requestAnimationFrame(() => {
    slides.forEach((el, i) => { el.style.backgroundImage = `url("${IMAGE_URLS[i]}")`; });
  });

  let current = 0, autoplayTimer = null;
  const interval = 7000;

  function update(){
    slides.forEach((s, i) => {
      s.classList.remove("active","left","right");
      if (i === current) s.classList.add("active");
      else if (i === (current + 1) % slides.length) s.classList.add("right");
      else if (i === (current - 1 + slides.length) % slides.length) s.classList.add("left");
    });
  }
  function move(dir){ current = (current + dir + slides.length) % slides.length; update(); }
  function manual(dir){ move(dir); reset(); }
  function reset(){ clearInterval(autoplayTimer); autoplayTimer = setInterval(() => move(1), interval); }

  const left  = slideshow.querySelector(".arrow-left");
  const right = slideshow.querySelector(".arrow-right");
  if (left)  left.addEventListener("click", () => manual(-1));
  if (right) right.addEventListener("click", () => manual(1));

  // Touch swipe
  let sx = 0, ex = 0;
  slideshow.addEventListener("touchstart", e => { sx = e.changedTouches[0].screenX; }, { passive: true });
  slideshow.addEventListener("touchend",   e => {
    ex = e.changedTouches[0].screenX;
    const d = sx - ex;
    if (Math.abs(d) >= 50) manual(d > 0 ? 1 : -1);
  }, { passive: true });

  // Light copy-protection inside slideshow
  ["contextmenu","copy","cut"].forEach(evt => slideshow.addEventListener(evt, e => e.preventDefault()));
  slideshow.addEventListener("dragstart", e => e.preventDefault());

  // Keep: prevent common save/source shortcuts site-wide (original behavior)
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && ["s","u","p"].includes(e.key.toLowerCase())) e.preventDefault();
  });

  update(); reset();
})();

// ===== container-3: mobile step 2 expand/collapse =====
(function(){
  const wrap = document.getElementById('step2wrap');
  if (!wrap) return;
  const diamond    = document.getElementById('diamondBox');
  const collapseBtn= document.getElementById('collapseBtn');
  const revealText = document.getElementById('revealText');
  const step2text  = document.getElementById('step2text');

  function lockH(){ const h = wrap.getBoundingClientRect().height; wrap.style.height = h + 'px'; wrap.style.overflow = 'hidden'; }
  function unlockH(){ wrap.style.height = ''; wrap.style.overflow = ''; }

  function expand(){
    if (wrap.classList.contains('expanded') || wrap.classList.contains('expanding')) return;
    lockH();
    revealText.style.display = 'none'; revealText.setAttribute('aria-hidden','true');
    step2text.style.display  = 'none';
    wrap.classList.add('expanding');
    diamond.setAttribute('aria-expanded','true'); diamond.setAttribute('aria-disabled','true');

    const onEnd = (e) => {
      if (e.propertyName !== 'flex-basis') return;
      wrap.removeEventListener('transitionend', onEnd, true);
      wrap.classList.remove('expanding');
      revealText.style.display = 'block'; revealText.setAttribute('aria-hidden','false');
      void revealText.offsetWidth;
      wrap.classList.add('expanded');
      requestAnimationFrame(unlockH);
    };
    wrap.addEventListener('transitionend', onEnd, true);
  }

  function collapse(){
    if (!wrap.classList.contains('expanded')) return;
    lockH();
    revealText.style.display = 'none'; revealText.setAttribute('aria-hidden','true');
    wrap.classList.remove('expanded'); wrap.classList.add('collapsing');
    diamond.setAttribute('aria-expanded','false'); diamond.removeAttribute('aria-disabled');

    const timer = setTimeout(cleanup, 360);
    function cleanupNow(e){ if (e.propertyName !== 'flex-basis') return; cleanup(); }
    function cleanup(){
      clearTimeout(timer); wrap.removeEventListener('transitionend', cleanupNow, true);
      wrap.classList.remove('collapsing');
      step2text.style.display = 'block';
      step2text.classList.add('revealing'); void step2text.offsetWidth; step2text.classList.remove('revealing');
      unlockH();
    }
    wrap.addEventListener('transitionend', cleanupNow, true);
  }

  if (diamond)    diamond.addEventListener('click', () => { if (!wrap.classList.contains('expanded')) expand(); });
  if (collapseBtn){
    collapseBtn.addEventListener('click', (e) => { if (!wrap.classList.contains('expanded')) return; e.stopPropagation(); collapse(); });
    collapseBtn.addEventListener('keydown', (e) => {
      if (!wrap.classList.contains('expanded')) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collapse(); }
    });
  }
})();

