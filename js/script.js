// ===== Helpers =====
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

// ===== Init =====
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Hero images fade-in =====
// CSS starts the portrait and the stick-figure sketch at opacity 0 so a
// late-arriving decode can't pop into frame mid-animation. We flip .is-loaded
// once the browser reports each image is actually ready — preferring
// img.decode() when available so the pixels are decoded, not just downloaded.
(function initHeroImages() {
  const imgs = document.querySelectorAll(".profile-image img, .profile-sketch");
  imgs.forEach((img) => {
    const reveal = () => img.classList.add("is-loaded");
    const ready = img.complete && img.naturalWidth > 0;
    if (ready && typeof img.decode === "function") {
      img.decode().then(reveal, reveal);
    } else if (ready) {
      reveal();
    } else {
      img.addEventListener("load", reveal, { once: true });
      img.addEventListener("error", reveal, { once: true }); // don't strand on error
    }
  });
})();

// ===== Mobile menu toggle =====
const menuBtn = $("#menuBtn");
const navLinks = $("#navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const isOpen = navLinks.getAttribute("data-open") === "true";
    navLinks.setAttribute("data-open", String(!isOpen));
    menuBtn.setAttribute("aria-expanded", String(!isOpen));
  });

  $$(".nav-links a").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks.setAttribute("data-open", "false");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    const clickedInside = navLinks.contains(e.target) || menuBtn.contains(e.target);
    if (!clickedInside) {
      navLinks.setAttribute("data-open", "false");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
}

// ===== Project filter =====
const chips = $$(".chip");
const projects = $$(".project");

if (chips.length && projects.length) {
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");

      const filter = chip.dataset.filter;
      projects.forEach((p) => {
        const tags = (p.dataset.tags || "").split(" ").filter(Boolean);
        const show = filter === "all" || tags.includes(filter);
        p.style.display = show ? "block" : "none";
      });
    });
  });
}

// ===== Copy email =====
$$(".copy-email").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const toast = btn.parentElement && btn.parentElement.querySelector(".toast");
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      if (toast) toast.textContent = "Copied.";
    } catch {
      if (toast) toast.textContent = "Copy failed.";
    }
    setTimeout(() => {
      if (toast) toast.textContent = "";
    }, 1500);
  });
});

// ===== Contact form (client-side only) =====
const form = $("#contactForm");
const statusEl = $("#formStatus");

if (form && statusEl) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    statusEl.textContent = "";

    const fd = new FormData(form);
    const name = (fd.get("name") || "").toString().trim();
    const email = (fd.get("email") || "").toString().trim();
    const message = (fd.get("message") || "").toString().trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (name.length < 2) return (statusEl.textContent = "Name is too short.");
    if (!emailOk) return (statusEl.textContent = "Enter a valid email.");
    if (message.length < 10) return (statusEl.textContent = "Message is too short.");

    statusEl.textContent = "Form is valid. Hook this up to a backend or use a service (Formspree, etc.).";
    form.reset();
  });
}

// ===== Scroll progress bar =====
const progress = $("#scrollProgress");
if (progress) {
  window.addEventListener("scroll", () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progress.style.width = `${pct}%`;
  });
}

// ===== Page transition: exit-then-navigate =====
// Intercepts internal same-tab links, plays the CSS exit animation (driven by
// .is-leaving on <body>), then navigates. The new page's CSS enter animation
// runs automatically on load. Keeps external links, anchor jumps, new-tab
// modifier clicks, and reduced-motion users on native behavior.
(function initPageTransition() {
  const EXIT_DUR_MS = 320; // must be ≥ longest exit (dur 260 + stagger ~180)
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    if (a.target === "_blank") return;
    if (a.hasAttribute("download")) return;

    const href = a.getAttribute("href");
    if (!href) return;
    // Skip protocol links and pure anchors — keep native behavior
    if (/^(https?:\/\/|mailto:|tel:|javascript:)/i.test(href)) return;
    if (href.startsWith("#")) return;

    // Only intercept same-origin in-site navigation
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin) return;
    // Skip file downloads / assets — let the browser handle them natively
    if (/\.(pdf|zip|png|jpe?g|gif|svg|webp|mp[34]|docx?|xlsx?|csv|txt)$/i.test(url.pathname)) return;
    // Same page + same hash -> nothing to do
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return;
    }

    e.preventDefault();

    if (reduceMotion) {
      window.location.href = url.href;
      return;
    }

    document.body.classList.add("is-leaving");
    setTimeout(() => {
      window.location.href = url.href;
    }, EXIT_DUR_MS);
  });

  // If the user navigates back via bfcache, clear .is-leaving so the entering
  // animation can run again from a clean state.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      document.body.classList.remove("is-leaving");
    }
  });
})();

// ===== Notebook parallax =====
// Ruled lines drift at ~0.3x scroll speed so cards appear to float above the
// paper. Uses CSS custom property --notebook-y; tile is 32px tall so we modulo
// to keep the transform value small and the wrap seamless.
(function initNotebookParallax() {
  const PARALLAX = 0.3;
  const TILE = 32;
  const root = document.body;
  if (!root) return;

  let rafQueued = false;
  function update() {
    // Negative so lines drift UP as the user scrolls down (classic parallax).
    // Modulo TILE keeps value within one tile period — looks continuous because
    // the pattern repeats at exactly TILE pixels.
    const y = -((window.scrollY * PARALLAX) % TILE);
    root.style.setProperty("--notebook-y", `${y.toFixed(2)}px`);
    rafQueued = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!rafQueued) {
        rafQueued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  update();
})();

// ===== Pencil writing: line-by-line reveal =====
// Splits headings into per-line spans so the clip-path reveal animation
// happens one line at a time. Skipped under prefers-reduced-motion.
(function initPencilWriting() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ---------- Line splitting ----------
  function splitByBr(el) {
    const lines = [[]];
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType === 1 && n.tagName === "BR") {
        lines.push([]);
      } else {
        // skip pure-whitespace text nodes that sit between tags in the HTML
        if (n.nodeType === 3 && !n.textContent.trim()) return;
        lines[lines.length - 1].push(n);
      }
    });
    return lines.filter((l) => l.length > 0);
  }

  function splitByWrapping(el) {
    // Only works on elements that contain plain text (no inline element children
    // other than BR). Mixed markup would lose structure if we rebuilt.
    const inlineKids = Array.from(el.children).filter((c) => c.tagName !== "BR");
    if (inlineKids.length > 0) return null;

    const text = el.textContent;
    const words = text.match(/\S+\s*/g);
    if (!words || words.length === 0) return null;

    const spans = words.map((w) => {
      const s = document.createElement("span");
      s.textContent = w;
      s.style.display = "inline-block";
      s.style.whiteSpace = "pre";
      return s;
    });
    el.textContent = "";
    spans.forEach((s) => el.appendChild(s));

    const lines = [[]];
    let lastTop = null;
    spans.forEach((s) => {
      const top = Math.round(s.getBoundingClientRect().top);
      if (lastTop !== null && Math.abs(top - lastTop) > 3) lines.push([]);
      lastTop = top;
      lines[lines.length - 1].push(s);
    });
    return lines;
  }

  function splitElement(el) {
    if (el.classList.contains("pe-split")) return null;
    if (el.querySelector("br")) return splitByBr(el);
    return splitByWrapping(el);
  }

  // ---------- Wire it up ----------
  const targets = document.querySelectorAll(
    ".section-head h2, .section-head p, .hero .title, .hero .tag, .card > h3, .tl-card > h3, .tl-group-title, .group-title"
  );

  targets.forEach((el) => {
    const lines = splitElement(el);
    if (!lines || lines.length < 2) return;

    // Copy the original animation-delay onto --pe-delay so child line spans
    // can offset from it; then swap the content for per-line wrappers.
    const delayStr = getComputedStyle(el).animationDelay || "0s";
    const baseDelayMs = (parseFloat(delayStr) || 0) * 1000;

    el.innerHTML = "";
    lines.forEach((nodes, idx) => {
      const line = document.createElement("span");
      line.className = "pe-line";
      line.style.setProperty("--line-idx", idx);
      nodes.forEach((n) => line.appendChild(n));
      el.appendChild(line);
    });
    el.style.setProperty("--pe-delay", `${baseDelayMs}ms`);
    el.classList.add("pe-split");
  });
})();

// ===== Sketchbook doodles =====
// Scatters transparent PNG sketches from images/transparent_images/ behind
// the main content. Two collision concerns are enforced by rejection
// sampling (each candidate position must pass both before it's kept):
//
//   1. Text that sits directly on the paper (section-head h2/p, group
//      titles, hero-content) is measured at runtime with offsetTop/Height,
//      so if you edit that text later — changing length, size, adding a
//      line — the doodles automatically avoid the new bounding box.
//   2. Previously-placed doodles; no two can land on top of each other.
//
// DOM order (fragment inserted before <main>) keeps doodles behind
// positioned cards without needing z-index gymnastics.
(function initDoodles() {
  // Curated pool: sketches that read well as background decoration.
  // (Skipping social-logo PNGs and the "hi there" one already in the hero.)
  const POOL = [
    "SystemsA+",
    "atParkWIthDog",
    "beanBag",
    "chicken",
    "eela",
    "gym",
    "heart",
    "kith",
    "sandCastle",
    "signature",
    "waiting for the bus",
    "walkingInPark",
  ];
  const COUNT = 5;
  const MAX_ATTEMPTS = 40;  // per-doodle retry budget before giving up
  const MARGIN = 14;        // min clear pixels between a doodle and any other rect
  const TOP_BUFFER = 100;   // clear the sticky site header area

  // ---------- Document measurements ----------
  const docHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    window.innerHeight
  );
  const pageWidth = document.body.clientWidth || window.innerWidth;

  // ---------- No-doodle zones ----------
  // Uses offsetTop/offsetLeft instead of getBoundingClientRect so the
  // measurement isn't skewed by the `translate: 0 28px` starting state of
  // the pe-enter animation — offset values are layout-only, not transformed.
  function absLayoutRect(el) {
    let top = 0;
    let left = 0;
    let node = el;
    while (node && node !== document.body) {
      top += node.offsetTop || 0;
      left += node.offsetLeft || 0;
      node = node.offsetParent;
    }
    return {
      top: top - MARGIN,
      left: left - MARGIN,
      right: left + el.offsetWidth + MARGIN,
      bottom: top + el.offsetHeight + MARGIN,
    };
  }

  // Anything in this list is a hard "don't overlap" zone. Extend with more
  // selectors if future pages add text that sits directly on the paper.
  const FORBIDDEN_SELECTOR = [
    ".section-head",     // h2 + subtitle on every non-hero page
    ".tl-group-title",   // EXPERIENCE label
    ".group-title",      // EDUCATION / SKILLS labels
    ".hero-content",     // everything in the landing hero
  ].join(", ");

  const forbidden = [];
  document.querySelectorAll(FORBIDDEN_SELECTOR).forEach((el) => {
    forbidden.push(absLayoutRect(el));
  });

  // ---------- Collision helpers ----------
  function overlaps(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }
  function collidesAny(candidate, list) {
    for (const r of list) {
      if (overlaps(candidate, r)) return true;
    }
    return false;
  }

  // ---------- Placement ----------
  const picks = [...POOL]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(COUNT, POOL.length));

  const placed = [];                 // bounding boxes of accepted doodles
  const doodles = [];                // final placement params, in draw order
  const bandH = docHeight / picks.length;

  picks.forEach((name, i) => {
    let params = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const jitter = 0.05 + Math.random() * 0.85;
      const rawTop = Math.floor(i * bandH + bandH * jitter);
      const top = Math.max(TOP_BUFFER, rawTop);
      const side = Math.random() < 0.5 ? "left" : "right";
      const offset = Math.floor(8 + Math.random() * 130);   // 8–138 px
      const width = 200 + Math.floor(Math.random() * 120);  // 200–320 px
      const rot = Math.random() * 8 - 4;                    // -4 → +4 deg (subtle tilt)
      const delay = 700 + i * 500 + Math.floor(Math.random() * 200);

      // Approximate bounding box. Sketches are roughly square, so est. height
      // = width; + 15% buffer on all sides covers rotation overshoot.
      const buf = width * 0.15;
      const leftPx = side === "left" ? offset : pageWidth - offset - width;
      const candidate = {
        top: top - buf,
        left: leftPx - buf,
        right: leftPx + width + buf,
        bottom: top + width + buf,
      };

      if (!collidesAny(candidate, forbidden) && !collidesAny(candidate, placed)) {
        params = { name, top, side, offset, width, rot, delay };
        placed.push(candidate);
        break;
      }
    }
    // If we couldn't place this one after MAX_ATTEMPTS, we just skip it —
    // better to have 4 well-placed sketches than 5 with one on top of a
    // heading.
    if (params) doodles.push(params);
  });

  // ---------- Render ----------
  const frag = document.createDocumentFragment();
  doodles.forEach((d) => {
    const img = document.createElement("img");
    img.className = "doodle";
    img.src = `images/transparent_images/${encodeURIComponent(d.name)}.png`;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.loading = "lazy";
    img.decoding = "async";

    img.style.top = `${d.top}px`;
    img.style[d.side] = `${d.offset}px`;
    img.style.width = `${d.width}px`;
    img.style.transform = `rotate(${d.rot.toFixed(1)}deg)`;
    img.style.setProperty("--doodle-delay", `${d.delay}ms`);

    frag.appendChild(img);
  });

  const main = document.querySelector("main");
  if (main && main.parentNode) {
    main.parentNode.insertBefore(frag, main);
  } else {
    document.body.appendChild(frag);
  }
})();
