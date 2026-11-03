const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-nav");
const backToTop = document.querySelector(".back-to-top");
const toast = document.querySelector("#site-toast");
const repoGrid = document.querySelector("#repo-grid");

window.addEventListener("load", () => {
  window.setTimeout(() => document.body.classList.add("is-loaded"), 300);
});

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("open");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  navigation.classList.toggle("open", !isOpen);
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

const updateScrollState = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
  backToTop.classList.toggle("visible", window.scrollY > 650);
};
window.addEventListener("scroll", updateScrollState, { passive: true });
updateScrollState();

backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll(".primary-nav a.active").forEach((link) => link.classList.remove("active"));
    const activeLink = document.querySelector(`.primary-nav a[href="#${entry.target.id}"]`);
    if (activeLink) activeLink.classList.add("active");
  });
}, { rootMargin: "-30% 0px -60% 0px" });
document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 5000);
}

document.querySelectorAll("[data-resume-link]").forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    const resumeUrl = link.getAttribute("href");
    try {
      const response = await fetch(resumeUrl, { method: "HEAD" });
      const type = response.headers.get("content-type") || "";
      if (!response.ok || (type && !type.toLowerCase().includes("pdf"))) {
        showToast("Resume PDF isn’t in the site folder yet. Add your actual PDF as resume.pdf to enable this download.");
        return;
      }
      const download = document.createElement("a");
      download.href = resumeUrl;
      download.download = "Sourabh-Kumar-Resume.pdf";
      document.body.append(download);
      download.click();
      download.remove();
    } catch (error) {
      showToast("Couldn’t check for the resume PDF. Add your actual PDF as resume.pdf and serve the site over HTTP.");
    }
  });
});

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

function renderRepositories(repositories) {
  if (!repositories.length) {
    repoGrid.innerHTML = '<div class="repo-error">No public repositories were returned by GitHub.</div>';
    return;
  }
  repoGrid.innerHTML = repositories.map((repo) => {
    const repositoryUrl = new URL(repo.html_url);
    const safeRepositoryUrl = repositoryUrl.protocol === "https:" && repositoryUrl.hostname === "github.com"
      ? repositoryUrl.href
      : "https://github.com/Sourabhpw";
    const language = repo.language
      ? `<span class="repo-language">${escapeHtml(repo.language)}</span>`
      : "";
    const description = repo.description
      ? escapeHtml(repo.description)
      : "No description provided.";
    const forkBadge = repo.fork ? '<span class="repo-badge">FORK</span>' : "";
    const stars = Number.isFinite(repo.stargazers_count)
      ? `<span>★ ${repo.stargazers_count}</span>`
      : "";
    const forks = Number.isFinite(repo.forks_count)
      ? `<span>⑂ ${repo.forks_count}</span>`
      : "";
    return `<article class="repo-card">
      <div class="repo-title-row"><a class="repo-name" href="${escapeHtml(safeRepositoryUrl)}" target="_blank" rel="noreferrer">${escapeHtml(repo.name)} <span class="repo-external">↗</span></a>${forkBadge}</div>
      <p>${description}</p>
      <div class="repo-meta">${language}${stars}${forks}</div>
    </article>`;
  }).join("");
}

async function loadRepositories() {
  repoGrid.innerHTML = '<div class="repo-loading"><span class="loading-spinner"></span> Fetching public repositories…</div>';
  try {
    const response = await fetch("https://api.github.com/users/Sourabhpw/repos?per_page=100&sort=updated", {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
    const repositories = await response.json();
    if (!Array.isArray(repositories)) throw new Error("Unexpected GitHub API response");
    renderRepositories(repositories);
  } catch (error) {
    repoGrid.innerHTML = '<div class="repo-error">Couldn’t load repository data. Check your connection or try again. <button type="button" id="repo-retry">Retry</button></div>';
    document.querySelector("#repo-retry").addEventListener("click", loadRepositories, { once: true });
  }
}
loadRepositories();

const contactForm = document.querySelector("#contact-form");
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const fields = new FormData(contactForm);
  const senderName = String(fields.get("name")).trim();
  const senderEmail = String(fields.get("email")).trim();
  const subject = String(fields.get("subject")).trim();
  const message = String(fields.get("message")).trim();
  const body = `Hi Sourabh,\n\n${message}\n\n— ${senderName}\n${senderEmail}`;
  const mailto = `mailto:sourabh.mca25@cmrit.ac.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.querySelector("#form-status").textContent = "Your email app should open with the message ready to send. This site does not store form submissions.";
  window.location.href = mailto;
});

const cursorGlow = document.querySelector(".cursor-glow");
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  }, { passive: true });
}
