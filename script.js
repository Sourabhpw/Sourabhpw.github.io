const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-nav");
const backToTop = document.querySelector(".back-to-top");
const toast = document.querySelector("#site-toast");
const repoGrid = document.querySelector("#repo-grid");
const repoFilters = document.querySelector("#repo-filters");
const repoSummary = document.querySelector("#repo-summary");

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

const formatUpdatedDate = (date) => new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric"
}).format(date);

function renderRepositories(repositories) {
  if (!repositories.length) {
    repoGrid.innerHTML = '<div class="repo-error">No public repositories were returned by GitHub.</div>';
    repoSummary.textContent = "No public repositories found.";
    repoFilters.replaceChildren();
    document.querySelector("#github-repo-count").textContent = "0";
    document.querySelector("#github-language-count").textContent = "0";
    return;
  }
  const validRepositories = repositories.filter((repo) =>
    typeof repo.name === "string" &&
    typeof repo.html_url === "string" &&
    repo.full_name?.toLowerCase() === "sourabhpw/" + repo.name.toLowerCase()
  );
  const languages = [...new Set(validRepositories.map((repo) => repo.language).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
  const categories = [...languages, ...(validRepositories.some((repo) => !repo.language) ? ["Not specified"] : [])];

  repoGrid.innerHTML = validRepositories.map((repo) => {
    const repositoryUrl = new URL(repo.html_url);
    if (repositoryUrl.protocol !== "https:" || repositoryUrl.hostname !== "github.com" ||
        repositoryUrl.pathname.toLowerCase() !== `/sourabhpw/${repo.name}`.toLowerCase()) {
      return "";
    }
    const category = repo.language || "Not specified";
    const description = repo.description
      ? `<p>${escapeHtml(repo.description)}</p>`
      : '<p class="repo-no-description">No description provided on GitHub.</p>';
    const updatedAt = repo.updated_at ? new Date(repo.updated_at) : null;
    const updated = updatedAt && !Number.isNaN(updatedAt.valueOf())
      ? `<span title="${escapeHtml(updatedAt.toISOString())}">Updated ${escapeHtml(formatUpdatedDate(updatedAt))}</span>`
      : "";
    const forkBadge = repo.fork ? '<span class="repo-badge">FORK</span>' : "";
    const stars = Number.isFinite(repo.stargazers_count)
      ? `<span>★ ${repo.stargazers_count}</span>`
      : "";
    const forks = Number.isFinite(repo.forks_count)
      ? `<span>⑂ ${repo.forks_count}</span>`
      : "";
    const monogram = repo.name.slice(0, 2).toUpperCase();
    return `<article class="repo-card project-repo-card" data-category="${escapeHtml(category)}">
      <div class="repo-card-top"><span class="repo-monogram" aria-hidden="true">${escapeHtml(monogram)}</span><span class="repo-category">${escapeHtml(category)}</span>${forkBadge}</div>
      <div class="repo-title-row"><a class="repo-name" href="${escapeHtml(repositoryUrl.href)}" target="_blank" rel="noreferrer">${escapeHtml(repo.name)} <span class="repo-external">↗</span></a></div>
      ${description}
      <div class="repo-meta">${repo.language ? `<span class="repo-language">${escapeHtml(repo.language)}</span>` : '<span>Language not detected</span>'}${stars}${forks}${updated}</div>
      <a class="repo-source-button" href="${escapeHtml(repositoryUrl.href)}" target="_blank" rel="noreferrer">View source code <span aria-hidden="true">↗</span></a>
    </article>`;
  }).join("");
  const count = repoGrid.querySelectorAll(".project-repo-card").length;
  const languageCount = [...new Set([...repoGrid.querySelectorAll(".project-repo-card")].map((card) =>
    card.dataset.category
  ).filter((language) => language !== "Not specified"))].length;
  document.querySelector("#github-repo-count").textContent = String(count);
  document.querySelector("#github-language-count").textContent = String(languageCount);
  repoSummary.textContent = `Showing ${count} public ${count === 1 ? "repository" : "repositories"} · sorted by most recently updated`;

  repoFilters.innerHTML = [
    `<button class="repo-filter active" type="button" data-filter="all" aria-pressed="true">All <span>${count}</span></button>`,
    ...categories.map((category) => {
      const categoryCount = [...repoGrid.querySelectorAll(".project-repo-card")]
        .filter((card) => card.dataset.category === category).length;
      return `<button class="repo-filter" type="button" data-filter="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)} <span>${categoryCount}</span></button>`;
    })
  ].join("");
}

repoFilters.addEventListener("click", (event) => {
  const filter = event.target.closest(".repo-filter");
  if (!filter) return;
  repoFilters.querySelectorAll(".repo-filter").forEach((button) => {
    const isActive = button === filter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  const selectedCategory = filter.dataset.filter;
  repoGrid.querySelectorAll(".project-repo-card").forEach((card) => {
    card.hidden = selectedCategory !== "all" && card.dataset.category !== selectedCategory;
  });
});

async function loadRepositories() {
  repoGrid.innerHTML = '<div class="repo-loading"><span class="loading-spinner"></span> Fetching public repositories…</div>';
  repoFilters.replaceChildren();
  try {
    const repositories = [];
    let url = "https://api.github.com/users/Sourabhpw/repos?per_page=100&sort=updated";
    while (url) {
      const response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      const page = await response.json();
      if (!Array.isArray(page)) throw new Error("Unexpected GitHub API response");
      repositories.push(...page);
      const nextLink = (response.headers.get("Link") || "")
        .split(",")
        .find((link) => /rel="next"/.test(link));
      url = nextLink ? nextLink.match(/<([^>]+)>/)?.[1] || null : null;
    }
    renderRepositories(repositories);
  } catch (error) {
    repoSummary.textContent = "Repository data is temporarily unavailable.";
    document.querySelector("#github-repo-count").textContent = "—";
    document.querySelector("#github-language-count").textContent = "—";
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
