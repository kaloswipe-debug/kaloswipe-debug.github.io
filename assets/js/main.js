"use strict";

/* ============================================================
   FAQ accordion (expects .accordion markup)
   - Numbers questions on desktop, plain text on mobile
   - Single-open behavior with animated height
   ============================================================ */
(() => {
  const MOBILE_MAX = 600;
  let faqInited = false;

  function updateMobileLabels() {
    const qs = document.querySelectorAll("#container-5 .question, .container-5 .question");
    if (window.innerWidth <= MOBILE_MAX) {
      qs.forEach((q) => {
        const t = q.getAttribute("data-text");
        if (t) q.textContent = t;
      });
    } else {
      qs.forEach((q, i) => {
        const t = q.getAttribute("data-text");
        if (t) q.textContent = (i + 1) + ". " + t;
      });
    }
  }

  function syncOpenHeights() {
    document.querySelectorAll(".accordion.active .extra-content").forEach((wrap) => {
      const inner = wrap.querySelector(".inner");
      if (inner) wrap.style.maxHeight = inner.scrollHeight + "px";
    });
  }

  function initAccordions() {
    if (faqInited) return;
    faqInited = true;

    const acc = document.querySelectorAll(".accordion");
    acc.forEach((el) => {
      const wrap = el.querySelector(".extra-content");

      // Make each accordion focusable & announce state
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-expanded", el.classList.contains("active") ? "true" : "false");
      if (wrap) wrap.setAttribute("aria-hidden", el.classList.contains("active") ? "false" : "true");

      // Helper to set visual + ARIA state for any item
      const setState = (target, active) => {
        target.classList.toggle("active", active);

        const tIcon  = target.querySelector(".icon");
        const tWrap  = target.querySelector(".extra-content");
        const tInner = tWrap && tWrap.querySelector(".inner");

        if (tIcon) {
          tIcon.textContent = active ? "–" : "+";
          tIcon.classList.toggle("rotate", active);
        }
        if (tWrap) {
          tWrap.style.maxHeight = active && tInner ? tInner.scrollHeight + "px" : null;
          tWrap.setAttribute("aria-hidden", active ? "false" : "true");
        }
        target.setAttribute("aria-expanded", active ? "true" : "false");
      };

      // Shared toggle for click + keyboard
      const toggleSelf = () => {
        const isActive = el.classList.contains("active");

        // Close others (single-open behavior)
        acc.forEach((o) => {
          if (o === el) return;
          setState(o, false);
        });

        // Toggle this one
        setState(el, !isActive);
      };

      el.addEventListener("click", toggleSelf);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSelf();
        }
      });

      // INIT state for pre-opened items
      setState(el, el.classList.contains("active"));
    });
  }

  // rAF-throttled resize/orientation handler (defined ONCE)
  let resizeRaf = null;
  function onResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      updateMobileLabels();
      syncOpenHeights();
      resizeRaf = null;
    });
  }
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);

  // When web fonts finish loading, remeasure any open panels
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncOpenHeights);
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateMobileLabels();
    initAccordions();

    // close all but the first .active at startup (optional)
    const opened = Array.from(document.querySelectorAll(".accordion.active"));
    opened.slice(1).forEach(el => {
      el.classList.remove("active");
      el.setAttribute("aria-expanded", "false");
      const wrap = el.querySelector(".extra-content");
      const icon = el.querySelector(".icon");
      if (icon) { icon.textContent = "+"; icon.classList.remove("rotate"); }
      if (wrap) { wrap.style.maxHeight = null; wrap.setAttribute("aria-hidden","true"); }
    });
    syncOpenHeights();
  });
})();

/* ============================================================
   container-3: desktop "no-select" box (prevent selection / context menu)
   ============================================================ */
(() => {
  const el = document.getElementById("no-select");
  if (!el) return;
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  el.addEventListener("selectstart", (e) => e.preventDefault());
})();

/* ============================================================
   Site-wide: light copy/print/source shortcut prevention
   (kept to match original behavior)
   ============================================================ */
(() => {
  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ["s", "u", "p"].includes(key)) {
      e.preventDefault();
    }
  });
})();

/* ============================================================
   container-3: slideshow (autoplay, arrows, swipe)
   ============================================================ */
(() => {
  const SLIDESHOW_INTERVAL = 7000;
  const SWIPE_THRESHOLD = 50;

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

  const slides = IMAGE_URLS.map(() => {
    const d = document.createElement("div");
    d.className = "slide";
    track.appendChild(d);
    return d;
  });

  requestAnimationFrame(() => {
    slides.forEach((el, i) => {
      el.style.backgroundImage = `url("${IMAGE_URLS[i]}")`;
    });
  });

  let current = 0;
  let autoplayTimer = null;

  function update() {
    slides.forEach((s, i) => {
      s.classList.remove("active", "left", "right");
      if (i === current) s.classList.add("active");
      else if (i === (current + 1) % slides.length) s.classList.add("right");
      else if (i === (current - 1 + slides.length) % slides.length) s.classList.add("left");
    });
  }

  function move(dir) {
    current = (current + dir + slides.length) % slides.length;
    update();
  }

  function manual(dir) {
    move(dir);
    reset();
  }

  function reset() {
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(() => move(1), SLIDESHOW_INTERVAL);
  }

  const left = slideshow.querySelector(".arrow-left");
  const right = slideshow.querySelector(".arrow-right");
  if (left) left.addEventListener("click", () => manual(-1));
  if (right) right.addEventListener("click", () => manual(1));

  // Touch swipe
  let sx = 0;
  slideshow.addEventListener("touchstart", (e) => {
    sx = e.changedTouches[0].screenX;
  }, { passive: true });

  slideshow.addEventListener("touchend", (e) => {
    const ex = e.changedTouches[0].screenX;
    const d = sx - ex;
    if (Math.abs(d) >= SWIPE_THRESHOLD) manual(d > 0 ? 1 : -1);
  }, { passive: true });

  // Light copy-protection inside slideshow
  ["contextmenu", "copy", "cut"].forEach((evt) =>
    slideshow.addEventListener(evt, (e) => e.preventDefault())
  );
  slideshow.addEventListener("dragstart", (e) => e.preventDefault());

  update();
  reset();

  // Pause autoplay when the tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(autoplayTimer);
    } else {
      reset();
    }
  });
})();

/* ============================================================
   container-3: mobile step 2 expand/collapse
   ============================================================ */
(() => {
  const wrap = document.getElementById("step2wrap");
  if (!wrap) return;

  const diamond = document.getElementById("diamondBox");
  const collapseBtn = document.getElementById("collapseBtn");
  const revealText = document.getElementById("revealText");
  const step2text = document.getElementById("step2text");

  function lockH() {
    const h = wrap.getBoundingClientRect().height;
    wrap.style.height = h + "px";
    wrap.style.overflow = "hidden";
  }
  function unlockH() {
    wrap.style.height = "";
    wrap.style.overflow = "";
  }

  function expand() {
    if (wrap.classList.contains("expanded") || wrap.classList.contains("expanding")) return;

    lockH();
    revealText.style.display = "none";
    revealText.setAttribute("aria-hidden", "true");
    step2text.style.display = "none";

    wrap.classList.add("expanding");
    diamond.setAttribute("aria-expanded", "true");
    diamond.setAttribute("aria-disabled", "true");

    const onEnd = (e) => {
      if (e.propertyName !== "flex-basis") return;
      cleanup();
    };

    const fallback = setTimeout(cleanup, 380); // mirrors collapse timing

    function cleanup() {
      wrap.removeEventListener("transitionend", onEnd, true);
      clearTimeout(fallback);
      wrap.classList.remove("expanding");

      revealText.style.display = "block";
      revealText.setAttribute("aria-hidden", "false");
      void revealText.offsetWidth; // reflow
      wrap.classList.add("expanded");

      requestAnimationFrame(unlockH);
    }

    wrap.addEventListener("transitionend", onEnd, true);
  }

  function collapse() {
    if (!wrap.classList.contains("expanded")) return;

    lockH();
    revealText.style.display = "none";
    revealText.setAttribute("aria-hidden", "true");
    wrap.classList.remove("expanded");
    wrap.classList.add("collapsing");

    diamond.setAttribute("aria-expanded", "false");
    diamond.removeAttribute("aria-disabled");

    const timer = setTimeout(cleanup, 360);

    function cleanupNow(e) {
      if (e.propertyName !== "flex-basis") return;
      cleanup();
    }

    function cleanup() {
      clearTimeout(timer);
      wrap.removeEventListener("transitionend", cleanupNow, true);
      wrap.classList.remove("collapsing");

      step2text.style.display = "block";
      step2text.classList.add("revealing");
      void step2text.offsetWidth; // force reflow
      step2text.classList.remove("revealing");

      unlockH();
    }

    wrap.addEventListener("transitionend", cleanupNow, true);
  }

  if (diamond) {
    diamond.addEventListener("click", () => {
      if (!wrap.classList.contains("expanded")) expand();
    });

    diamond.addEventListener("keydown", (e) => {
      if (wrap.classList.contains("expanded")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        expand();
      }
    });
  }

  if (collapseBtn) {
    collapseBtn.addEventListener("click", (e) => {
      if (!wrap.classList.contains("expanded")) return;
      e.stopPropagation();
      collapse();
    });

    collapseBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (wrap.classList.contains("expanded")) collapse();
      }
    });
  }
})();

// ======================== AFTER CONTAINER #5 ========================
(function initAfterC5() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAfterC5);
    return;
  }
  var wrap = document.getElementById("after-c5-logo");
  if (!wrap || !(window.GE && typeof GE.initProtectedZone === "function")) return;
  GE.initProtectedZone(wrap, { guardSelector: ".protect-guard" });
})();

/* ============================================================
   GE helper: initProtectedZone (shared)
   ============================================================ */
(() => {
  function initProtectedZone(root, { guardSelector = ".protect-guard" } = {}) {
    if (!root || root.dataset.protectInit === "1") return;
    root.dataset.protectInit = "1";

    const guard = root.querySelector(guardSelector);
    const target = guard || root;

    // Block context menu / selection / drag on the protected zone
    const block = (e) => e.preventDefault();
    ["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach((evt) => {
      target.addEventListener(evt, block);
    });

    // Long-press soak (mobile)
    let pressTimer;
    const startPress = () => { pressTimer = setTimeout(() => {}, 650); };
    const endPress   = () => clearTimeout(pressTimer);
    target.addEventListener("touchstart", startPress, { passive: true });
    target.addEventListener("touchend",   endPress,   { passive: true });

    // Make any images inside non-draggable
    root.querySelectorAll("img").forEach((img) => img.setAttribute("draggable", "false"));
  }

  window.GE = window.GE || {};
  window.GE.initProtectedZone = initProtectedZone;
})();

/* ============================================================
   Top-of-page Gabriel Edits logo (moved from footer-logos.html)
   ============================================================ */
(() => {
  document.addEventListener("DOMContentLoaded", () => {
    // Prevent duplicate insert
    if (document.getElementById("ge-logo-wrap")) return;

    const src = "https://i.imgur.com/Hi9k0uo.png";

    const wrap = document.createElement("div");
    wrap.id = "ge-logo-wrap";
    wrap.className = "logo-protect";
    wrap.innerHTML = `
      <img src="${src}" alt="Gabriel Edits Logo" draggable="false">
      <div class="protect-guard" aria-hidden="true"></div>
    `;

    // Mount priority: #logo-1 → <main.page> → <main> → <body>
    const anchor = document.getElementById("logo-1");
    const mount =
      anchor ||
      document.querySelector("main.page") ||
      document.querySelector("main") ||
      document.body;

    if (anchor) anchor.innerHTML = "";
    mount.insertBefore(wrap, mount.firstChild);

    if (window.GE && typeof GE.initProtectedZone === "function") {
      GE.initProtectedZone(wrap, { guardSelector: ".protect-guard" });
    }
  });
})();

/* ============================================================
   container-6: reveal-card + bottom logo protection
   ============================================================ */
(() => {
  const section = document.getElementById("container-6");
  if (!section) return;

  /* ---------- Reveal card ---------- */
  (function initRevealCard() {
    const card  = section.querySelector(".reveal-card");
    if (!card || card.hasAttribute("data-ge-reveal-init")) return;
    card.setAttribute("data-ge-reveal-init", "1");

    const img = card.querySelector(".rc-media img");
    const src = card.getAttribute("data-src");
    if (img && src) img.src = src;

    const cs = getComputedStyle(card);
    const collapsedH = (cs.getPropertyValue("--collapsed-h") || "").trim() || "78px";
    card.style.minBlockSize = collapsedH;

    const toggle = () => {
      const willOpen = !card.classList.contains("open");
      card.classList.toggle("open", willOpen);
      card.setAttribute("aria-expanded", willOpen ? "true" : "false");
    };

    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });

    GE.initProtectedZone(card, { guardSelector: ".protect-guard" });
    if (img) img.setAttribute("draggable","false");
  })();

  /* ---------- Bottom logo protect ---------- */
  (function initLogoProtect() {
    const wrap = section.querySelector("#ge-logo");
    if (!wrap || wrap.hasAttribute("data-ge-logo-protect")) return;
    wrap.setAttribute("data-ge-logo-protect", "1");

    GE.initProtectedZone(wrap, { guardSelector: ".protect-guard" });
  })();
})();

/* ============================================================
   Smooth scroll: Lenis + anchors (moved from scripts.html)
   ============================================================ */
(() => {
  // Init Lenis once (desktop only)
  function initLenisOnce() {
    if (!window.Lenis || window.innerWidth <= 768 || window.__lenis) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      direction: "vertical",
      gestureDirection: "vertical",
      smoothTouch: false,
      touchMultiplier: 1.5,
    });

    window.__lenis = lenis;

    const loop = (time) => {
      if (!window.__lenis) return;
      window.__lenis.raf(time);
      window.__lenisRaf = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(window.__lenisRaf);
    window.__lenisRaf = requestAnimationFrame(loop);
  }

  // Run once when ready
  const ready = (fn) =>
    (document.readyState === "loading")
      ? document.addEventListener("DOMContentLoaded", fn)
      : fn();

  ready(initLenisOnce);

  // If user resizes from mobile → desktop, allow late init
  window.addEventListener("resize", initLenisOnce);

  // Smooth anchors (delegated; runs once)
  if (!window.__smoothAnchorsInit) {
    window.__smoothAnchorsInit = true;

    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[data-smooth][href^="#"]');
      if (!a) return;

      const id = a.getAttribute("href").slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;

      e.preventDefault();

      // Use Lenis if present; otherwise fallback tween
      if (window.__lenis) {
        window.__lenis.scrollTo(target, {
          offset: 0,
          duration: 0.9,
          easing: t => (t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t + 2, 4)/2),
        });
      } else {
        const start = window.scrollY;
        const end = start + target.getBoundingClientRect().top;
        const duration = 900;
        let startTime = null;

        const easeInOutQuart = (t) =>
          t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t + 2, 4)/2;

        const step = (ts) => {
          if (!startTime) startTime = ts;
          const p = Math.min((ts - startTime) / duration, 1);
          const y = start + (end - start) * easeInOutQuart(p);
          window.scrollTo(0, y);
          if (p < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
      }
    });
  }
})();

/* ============================================================
   STANDALONES: headline reveal + features block (icons, in-view, text swap)
   (this replaces the stray nested block you had inside Smooth Anchors)
   ============================================================ */
(() => {
  // Headline reveal
  document.addEventListener("DOMContentLoaded", () => {
    const headline = document.getElementById("alx-headline");
    if (!headline) return;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          headline.classList.add("alx-visible");
          o.unobserve(headline);
        }
      });
    }, { threshold: 0.2 });
    obs.observe(headline);
  });

  // Features behavior
  const container = document.getElementById("features");
  if (!container) return;

  // Icon URLs → CSS var per icon
  const ICON_URLS = [
    "https://i.imgur.com/fBS3wJ4.png",
    "https://i.imgur.com/0XgLEJ5.png",
    "https://i.imgur.com/OAVRPFc.png",
  ];
  requestAnimationFrame(() => {
    container.querySelectorAll(".features__icon").forEach(el => {
      const idx = Number(el.getAttribute("data-img-index"));
      const url = ICON_URLS[idx];
      if (url) el.style.setProperty("--bg", `url("${url}")`);
    });
  });

  // Scroll-in cards
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  container.querySelectorAll(".features__item").forEach(el => cardObserver.observe(el));

  // Mobile/desktop description swap
  const descEls = Array.from(container.querySelectorAll(".features__item .features__text"));
  const desktopTexts = descEls.map(el => el.textContent.trim());
  const mobileTexts = [
    "Video editors who don't have any autonomy and constantly have to ask for directions.",
    "Video editors who can't translate a creator's vague, vision-driven language into concrete editing choices.",
    "Video editors who take a long time to adapt to new circumstances and get a smooth workflow going."
  ];
  const mq = window.matchMedia("(max-width: 768px)");
  function applyTextSwap(e){
    const isMobile = e.matches;
    descEls.forEach((el, i) => { el.textContent = isMobile ? mobileTexts[i] : desktopTexts[i]; });
  }
  applyTextSwap(mq);
  (mq.addEventListener ? mq.addEventListener("change", applyTextSwap) : mq.addListener(applyTextSwap));

  // Local guards for copy/select/drag inside features
  ["contextmenu","copy","cut"].forEach(evt =>
    container.addEventListener(evt, e => e.preventDefault(), { passive:false })
  );
  container.addEventListener("dragstart", e => e.preventDefault());

  // Touch/selection niceties
  let pressTimer;
  container.addEventListener("touchstart", () => { pressTimer=setTimeout(()=>{},600); }, { passive:true });
  container.addEventListener("touchend", () => clearTimeout(pressTimer));
  container.querySelectorAll("img").forEach(img => img.setAttribute("draggable","false"));
  container.addEventListener("selectstart", (e) => e.preventDefault(), { passive: false });

  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const anchor = sel.anchorNode && (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode);
    if (anchor && container.contains(anchor)) sel.removeAllRanges();
  });

  container.addEventListener("gesturestart", (e) => e.preventDefault());
  container.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") { if (document.activeElement) document.activeElement.blur?.(); }
  });

   

})();

// Drop this anywhere after Lenis is created (e.g., in main.js after Lenis init)
(() => {
  const wrap = document.getElementById('book-your-call');
  if (!wrap) return;

  let paused = false;
  const stop  = () => { if (window.__lenis && !paused) { window.__lenis.stop();  paused = true; } };
  const start = () => { if (window.__lenis &&  paused) { window.__lenis.start(); paused = false; } };

  wrap.addEventListener('pointerenter', stop);
  wrap.addEventListener('pointerleave', start);

  // If the iframe grabs focus, also stop Lenis
  window.addEventListener('blur', stop, true);
  window.addEventListener('focus', start, true);
})();
