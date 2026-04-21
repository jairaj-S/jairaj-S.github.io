// ===== Helpers =====
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

function getTheme() {
  return localStorage.getItem("theme") || "dark";
}

// ===== Init =====
setTheme(getTheme());

const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Fake resume link placeholder
const resumeLink = $("#resumeLink");
if (resumeLink) {
  resumeLink.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Replace # with your resume URL (e.g., ./resume.pdf).");
  });
}

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

// ===== Theme toggle =====
const themeBtn = $("#themeBtn");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current === "dark" ? "light" : "dark");
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
