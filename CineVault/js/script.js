/* CineVault shared behavior: theme, auth, validation, TVMaze catalog */

const STORAGE = {
  theme: "cinevault-theme",
  users: "cinevault-users",
  session: "cinevault-session",
  watchlist: "cinevault-watchlist",
  lastSearch: "cinevault-last-search",
  messages: "cinevault-messages",
};

const TVMAZE = "https://api.tvmaze.com";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function currentUser() {
  const email = localStorage.getItem(STORAGE.session);
  if (!email) return null;
  return readJson(STORAGE.users, []).find((user) => user.email === email) || null;
}

function applyTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORAGE.theme, next);
}

applyTheme(localStorage.getItem(STORAGE.theme) || "dark");

function initTheme() {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

function initNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.classList.add("is-active");
  });

  const menu = document.querySelector("[data-nav-menu]");
  const burger = document.querySelector("[data-menu-toggle]");
  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  const user = currentUser();
  const authLink = document.querySelector("[data-auth-link]");
  const profileLink = document.querySelector("[data-profile-link]");
  if (authLink && profileLink) {
    if (user) {
      authLink.hidden = true;
      profileLink.hidden = false;
      profileLink.textContent = user.name.split(" ")[0];
    } else {
      authLink.hidden = false;
      profileLink.hidden = true;
    }
  }
}

const rules = {
  required(value) {
    return value.trim() ? "" : "This field is required.";
  },
  email(value) {
    if (!value.trim()) return "Enter your email.";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
    return ok ? "" : "Enter a valid email, for example name@studio.com.";
  },
  password(value) {
    if (value.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(value)) return "Add at least one uppercase letter.";
    if (!/[a-z]/.test(value)) return "Add at least one lowercase letter.";
    if (!/\d/.test(value)) return "Add at least one number.";
    if (!/[^A-Za-z0-9]/.test(value)) return "Add a special character such as ! or #.";
    return "";
  },
  phone(value) {
    const compact = value.replace(/[\s()-]/g, "");
    if (!compact) return "Enter a phone number.";
    const ok = /^\+?[0-9]{10,15}$/.test(compact);
    return ok ? "" : "Use 10–15 digits, optionally starting with +.";
  },
  name(value) {
    if (value.trim().length < 2) return "Enter your full name.";
    return "";
  },
};

function setFieldError(input, message) {
  const field = input.closest(".field");
  const box = field?.querySelector(".field-error");
  if (!field || !box) return !message;
  box.textContent = message;
  field.classList.toggle("is-invalid", Boolean(message));
  return !message;
}

function validateField(input) {
  const type = input.dataset.validate;
  const checker = rules[type] || rules.required;
  return setFieldError(input, checker(input.value));
}

function validateForm(form) {
  const inputs = [...form.querySelectorAll("[data-validate]")];
  return inputs.map(validateField).every(Boolean);
}

function showStatus(el, type, text) {
  if (!el) return;
  el.className = `form-status is-visible ${type}`;
  el.textContent = text;
}

function initSignup() {
  const form = document.querySelector("#signup-form");
  if (!form) return;
  const status = form.querySelector(".form-status");

  form.addEventListener("input", (event) => {
    if (event.target.matches("[data-validate]")) validateField(event.target);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm(form)) {
      showStatus(status, "error", "Please fix the highlighted fields.");
      return;
    }

    const user = {
      name: form.elements.namedItem("name").value.trim(),
      email: form.elements.namedItem("email").value.trim().toLowerCase(),
      phone: form.elements.namedItem("phone").value.trim(),
      password: form.elements.namedItem("password").value,
      createdAt: new Date().toISOString(),
    };

    const users = readJson(STORAGE.users, []);
    if (users.some((item) => item.email === user.email)) {
      showStatus(status, "error", "This email is already registered. Try logging in.");
      return;
    }

    users.push(user);
    writeJson(STORAGE.users, users);
    localStorage.setItem(STORAGE.session, user.email);
    showStatus(status, "success", "Account created. Opening your profile…");
    window.location.href = "profile.html";
  });
}

function initLogin() {
  const form = document.querySelector("#login-form");
  if (!form) return;
  const status = form.querySelector(".form-status");

  form.addEventListener("input", (event) => {
    if (event.target.matches("[data-validate]")) validateField(event.target);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm(form)) {
      showStatus(status, "error", "Please fix the highlighted fields.");
      return;
    }

    const email = form.elements.namedItem("email").value.trim().toLowerCase();
    const password = form.elements.namedItem("password").value;
    const user = readJson(STORAGE.users, []).find((item) => item.email === email && item.password === password);

    if (!user) {
      showStatus(status, "error", "Email or password does not match our records.");
      return;
    }

    localStorage.setItem(STORAGE.session, user.email);
    window.location.href = "profile.html";
  });
}

function initProfile() {
  const root = document.querySelector("[data-profile]");
  if (!root) return;
  const user = currentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  root.querySelector("[data-name]").textContent = user.name;
  root.querySelector("[data-email]").textContent = user.email;
  root.querySelector("[data-phone]").textContent = user.phone;
  root.querySelector("[data-created]").textContent = new Date(user.createdAt).toLocaleDateString();

  document.querySelector("[data-logout]")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE.session);
    window.location.href = "index.html";
  });
}

function initContact() {
  const form = document.querySelector("#contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");

  form.addEventListener("input", (event) => {
    if (event.target.matches("[data-validate]")) validateField(event.target);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm(form)) {
      showStatus(status, "error", "Please fix the highlighted fields.");
      return;
    }
    const messages = readJson(STORAGE.messages, []);
    messages.push({
      name: form.elements.namedItem("name").value.trim(),
      email: form.elements.namedItem("email").value.trim().toLowerCase(),
      phone: form.elements.namedItem("phone").value.trim(),
      message: form.elements.namedItem("message").value.trim(),
      sentAt: new Date().toISOString(),
    });
    writeJson(STORAGE.messages, messages);
    showStatus(status, "success", "Your note was saved in this browser.");
    form.reset();
  });
}

function watchlist() {
  return readJson(STORAGE.watchlist, []);
}

function isSaved(id) {
  return watchlist().some((item) => String(item.id) === String(id));
}

function toggleWatchlist(show) {
  const list = watchlist();
  const exists = list.some((item) => String(item.id) === String(show.id));
  const next = exists
    ? list.filter((item) => String(item.id) !== String(show.id))
    : [...list, { id: show.id, name: show.name, image: show.image?.medium || "", genres: show.genres || [] }];
  writeJson(STORAGE.watchlist, next);
  return !exists;
}

function cardHtml(show) {
  const img = show.image?.medium || "images/empty.svg";
  const saved = isSaved(show.id);
  return `
    <article class="show-card">
      <a href="details.html?id=${encodeURIComponent(show.id)}">
        <img src="${img}" alt="Poster for ${escapeHtml(show.name)}">
      </a>
      <div class="body">
        <h3>${escapeHtml(show.name)}</h3>
        <p class="muted">${(show.genres || []).slice(0, 2).join(" · ") || "Uncategorized"}</p>
        <button class="btn btn-ghost" type="button" data-save-id="${show.id}">
          ${saved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function showApiStatus(el, type, text) {
  if (!el) return;
  el.className = `api-status is-visible ${type}`;
  el.textContent = text;
}

async function fetchShows(query) {
  if (query) {
    const res = await fetch(`${TVMAZE}/search/shows?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    return data.map((row) => row.show);
  }
  const res = await fetch(`${TVMAZE}/shows?page=1`);
  if (!res.ok) throw new Error("Catalog failed");
  return res.json();
}

function initCatalog() {
  const grid = document.querySelector("[data-catalog]");
  if (!grid) return;

  const form = document.querySelector("#search-form");
  const status = document.querySelector("[data-api-status]");
  const skeletons = document.querySelector("[data-skeletons]");
  const saved = readJson(STORAGE.lastSearch, { q: "", genre: "all" });
  if (form) {
    form.q.value = saved.q || "";
    form.genre.value = saved.genre || "all";
  }

  let requestNumber = 0;
  async function render() {
    const thisRequest = ++requestNumber;
    const q = form?.q.value.trim() || "";
    const genre = form?.genre.value || "all";
    writeJson(STORAGE.lastSearch, { q, genre });
    skeletons.hidden = false;
    grid.innerHTML = "";
    status.classList.remove("is-visible");

    try {
      const shows = await fetchShows(q);
      if (thisRequest !== requestNumber) return;
      const filtered = genre === "all"
        ? shows
        : shows.filter((show) => (show.genres || []).includes(genre));
      skeletons.hidden = true;

      if (!filtered.length) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1">
            <img src="images/empty.svg" alt="">
            <h2>No titles matched</h2>
            <p class="muted">Try another title or a broader genre.</p>
          </div>`;
        return;
      }

      grid.innerHTML = filtered.slice(0, 24).map(cardHtml).join("");
      grid.querySelectorAll("[data-save-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.saveId;
          const show = filtered.find((item) => String(item.id) === String(id));
          if (!show) return;
          const savedNow = toggleWatchlist(show);
          btn.textContent = savedNow ? "Saved" : "Save";
        });
      });
    } catch {
      if (thisRequest !== requestNumber) return;
      skeletons.hidden = true;
      showApiStatus(status, "error", "Could not reach TVMaze. Check your connection and try again.");
    }
  }

  let searchTimer;
  form?.elements.q?.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(render, 350);
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  form?.genre.addEventListener("change", render);
  render();
}

function initHomePreview() {
  const grid = document.querySelector("[data-home-preview]");
  if (!grid) return;
  fetch(`${TVMAZE}/shows?page=0`)
    .then((res) => {
      if (!res.ok) throw new Error("fail");
      return res.json();
    })
    .then((shows) => {
      grid.innerHTML = shows.slice(0, 8).map(cardHtml).join("");
      grid.querySelectorAll("[data-save-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.saveId;
          const show = shows.find((item) => String(item.id) === String(id));
          if (!show) return;
          btn.textContent = toggleWatchlist(show) ? "Saved" : "Save";
        });
      });
    })
    .catch(() => {
      grid.innerHTML = `<p class="muted">Preview titles could not be loaded right now.</p>`;
    });
}

function initWatchlistPage() {
  const grid = document.querySelector("[data-watchlist]");
  if (!grid) return;
  const list = watchlist();
  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <img src="images/empty.svg" alt="">
        <h2>Your vault is empty</h2>
        <p class="muted">Save titles from the catalog and they will appear here.</p>
        <a class="btn btn-primary" href="catalog.html">Browse catalog</a>
      </div>`;
    return;
  }
  grid.innerHTML = list.map((item) => cardHtml({ ...item, image: { medium: item.image || "images/empty.svg" } })).join("");
  grid.querySelectorAll("[data-save-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.saveId;
      const item = list.find((row) => String(row.id) === String(id));
      toggleWatchlist(item);
      initWatchlistPage();
    });
  });
}

function initDetails() {
  const root = document.querySelector("[data-details]");
  if (!root) return;
  const id = new URLSearchParams(window.location.search).get("id");
  const status = document.querySelector("[data-api-status]");
  if (!id) {
    showApiStatus(status, "error", "Missing title id.");
    return;
  }

  fetch(`${TVMAZE}/shows/${encodeURIComponent(id)}`)
    .then((res) => {
      if (!res.ok) throw new Error("fail");
      return res.json();
    })
    .then((show) => {
      root.hidden = false;
      root.querySelector("[data-title]").textContent = show.name;
      root.querySelector("[data-summary]").innerHTML = sanitizeSummary(show.summary) || "<p>No synopsis yet.</p>";
      root.querySelector("[data-meta]").textContent = [
        show.language,
        (show.genres || []).join(", "),
        show.premiered || "Year unknown",
      ].filter(Boolean).join(" · ");
      const img = root.querySelector("[data-poster]");
      img.src = show.image?.original || show.image?.medium || "images/empty.svg";
      img.alt = `Poster for ${show.name}`;
      const saveBtn = root.querySelector("[data-save]");
      saveBtn.textContent = isSaved(show.id) ? "Remove from vault" : "Save to vault";
      saveBtn.addEventListener("click", () => {
        const savedNow = toggleWatchlist(show);
        saveBtn.textContent = savedNow ? "Remove from vault" : "Save to vault";
      });
    })
    .catch(() => {
      showApiStatus(status, "error", "This title could not be loaded from TVMaze.");
    });
}

function sanitizeSummary(summary) {
  const template = document.createElement("template");
  template.innerHTML = String(summary || "");
  const allowed = new Set(["P", "BR", "B", "STRONG", "I", "EM", "UL", "OL", "LI"]);
  const clean = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowed.has(child.tagName)) {
          child.replaceWith(...child.childNodes);
        } else {
          [...child.attributes].forEach((attribute) => child.removeAttribute(attribute.name));
          clean(child);
        }
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    });
  };
  clean(template.content);
  return template.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initSignup();
  initLogin();
  initProfile();
  initContact();
  initCatalog();
  initHomePreview();
  initWatchlistPage();
  initDetails();
});
