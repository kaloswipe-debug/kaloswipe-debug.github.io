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
    const qs = document.querySelectorAll(".question");
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

      // ✅ INIT state for pre-opened items (this was misplaced before)
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
    syncOpenHeights(); // ensure correct initial height if any are open by default
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
      if (!wrap.classList.contains("expanded")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        collapse();
      }
    });
  }
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
    wrap.id = "ge-logo-wrap";            // keep the same id
    wrap.className = "logo-protect";     // uses your shared CSS
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

    if (anchor) anchor.innerHTML = "";   // clear any placeholder
    mount.insertBefore(wrap, mount.firstChild);

    // Apply your shared protection helper
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
