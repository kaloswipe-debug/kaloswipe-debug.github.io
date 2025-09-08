"use strict";

/* ============================================================
   FAQ accordion (expects .accordion markup)
   - Numbers questions on desktop, plain text on mobile
   - Single-open behavior with animated height
   ============================================================ */
(() => {
  function updateMobileLabels() {
    const qs = document.querySelectorAll(".question");
    if (window.innerWidth <= 600) {
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

  function initAccordions() {
    const acc = document.querySelectorAll(".accordion");
    acc.forEach((el) => {
      const icon = el.querySelector(".icon");
      const wrap = el.querySelector(".extra-content");
      const inner = el.querySelector(".inner");

      el.addEventListener("click", () => {
        const isActive = el.classList.contains("active");

        // Close others
        acc.forEach((o) => {
          if (o !== el) {
            o.classList.remove("active");
            const io = o.querySelector(".icon");
            const wo = o.querySelector(".extra-content");
            if (io) {
              io.textContent = "+";
              io.classList.remove("rotate");
            }
            if (wo) wo.style.maxHeight = null;
          }
        });

        // Toggle clicked
        el.classList.toggle("active");
        if (icon) {
          icon.textContent = isActive ? "+" : "–";
          icon.classList.toggle("rotate");
        }
        if (wrap && inner) {
          wrap.style.maxHeight = isActive ? null : inner.scrollHeight + "px";
        }
      });
    });
  }

  window.addEventListener("resize", updateMobileLabels);
  document.addEventListener("DOMContentLoaded", () => {
    updateMobileLabels();
    initAccordions();
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

  // Defer background image assignment to next frame
  requestAnimationFrame(() => {
    slides.forEach((el, i) => {
      el.style.backgroundImage = `url("${IMAGE_URLS[i]}")`;
    });
  });

  let current = 0;
  let autoplayTimer = null;
  const interval = 7000;

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
    autoplayTimer = setInterval(() => move(1), interval);
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
    if (Math.abs(d) >= 50) manual(d > 0 ? 1 : -1);
  }, { passive: true });

  // Light copy-protection inside slideshow
  ["contextmenu", "copy", "cut"].forEach((evt) =>
    slideshow.addEventListener(evt, (e) => e.preventDefault())
  );
  slideshow.addEventListener("dragstart", (e) => e.preventDefault());

  update();
  reset();
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
      wrap.removeEventListener("transitionend", onEnd, true);
      wrap.classList.remove("expanding");

      revealText.style.display = "block";
      revealText.setAttribute("aria-hidden", "false");
      void revealText.offsetWidth; // force reflow
      wrap.classList.add("expanded");

      requestAnimationFrame(unlockH);
    };

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

    // Make sure keyboard users can trigger via Enter/Space if diamond is focusable
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
