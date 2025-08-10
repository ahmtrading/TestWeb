/* script.js
 - Theme toggle (persisted)
 - Auth modal with demo OR backend-ready login/signup
 - Reveal animations using IntersectionObserver
 - Class card click navigation (links already point to classX.html)
 - Dynamic footer year
*/

/* CONFIG
  To use a real backend:
    - set API_BASE to your API base URL (e.g. "https://api.lumined.com")
    - backend must expose:
       POST /api/auth/login  { email, password } -> returns { token, user }
       POST /api/auth/signup { name, email, password } -> returns { token, user }
       GET /api/auth/me -> requires Authorization: Bearer <token> returns { user }
  If API_BASE = "" (empty) the script runs in demo mode (no server).
*/
const API_BASE = ""; // <-- set to "" for demo mode. Set to "https://your.api" for real backend

const TOKEN_KEY = "lumined_token";
const THEME_KEY = "lumined_theme";

/* DOM */
const body = document.body;
const themeToggle = document.getElementById("theme-toggle");
const authBtn = document.getElementById("auth-btn");
const authCta = document.getElementById("auth-cta");
const authModal = document.getElementById("auth-modal");
const modalClose = document.getElementById("modal-close");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const showSignupBtn = document.getElementById("show-signup");
const showLoginBtn = document.getElementById("show-login");
const yearEl = document.getElementById("year");

/* theme */
function loadTheme() {
  const t = localStorage.getItem(THEME_KEY) || "light";
  if (t === "dark") body.classList.add("dark");
  else body.classList.remove("dark");
}
function toggleTheme() {
  body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, body.classList.contains("dark") ? "dark" : "light");
}
themeToggle.addEventListener("click", toggleTheme);
loadTheme();

/* auth helpers */
function tokenSet(token) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function isLoggedIn() {
  return !!getToken();
}
function updateAuthUI() {
  if (isLoggedIn()) {
    authBtn.textContent = "Profile";
    authBtn.classList.add("primary");
  } else {
    authBtn.textContent = "Login";
    authBtn.classList.remove("primary");
  }
}
updateAuthUI();

/* show/hide modal */
function openModal() {
  authModal.setAttribute("aria-hidden", "false");
}
function closeModal() {
  authModal.setAttribute("aria-hidden", "true");
}
authBtn.addEventListener("click", () => {
  if (isLoggedIn()) {
    // show profile menu basic demo: in real app navigate to profile/dashboard
    const go = confirm("Open profile page? (OK = open demo profile)");
    if (go) window.location.href = "/profile.html"; // replace with real profile page
  } else {
    openModal();
  }
});
authCta.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
authModal.addEventListener("click", (e) => { if (e.target === authModal) closeModal(); });

/* toggle between login & signup forms */
showSignupBtn.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
});
showLoginBtn.addEventListener("click", () => {
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

/* Demo-mode helpers */
function demoLogin(email) {
  // simple demo token
  const token = "demo-token:" + btoa(email + ":" + Date.now());
  tokenSet(token);
  updateAuthUI();
  closeModal();
  alert("Demo login successful. Profile button is shown.");
}
function demoSignup(name, email) {
  // in demo, signup simply logs in user
  demoLogin(email);
}

/* Backend-ready functions */
async function backendRequest(path, data = {}) {
  const url = API_BASE + path;
  const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error("Network error: " + res.status);
  return res.json();
}

/* Login form handler */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;

  if (API_BASE) {
    // backend mode
    try {
      const data = await backendRequest("/api/auth/login", { email, password });
      if (data.token) {
        tokenSet(data.token);
        updateAuthUI();
        closeModal();
        alert("Login successful");
      } else throw new Error("Invalid response from server");
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  } else {
    // demo mode: any credentials accepted for preview
    demoLogin(email);
  }
});

/* Signup form handler */
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim();
  const email = f.email.value.trim();
  const password = f.password.value;

  if (API_BASE) {
    try {
      const data = await backendRequest("/api/auth/signup", { name, email, password });
      if (data.token) {
        tokenSet(data.token);
        updateAuthUI();
        closeModal();
        alert("Account created & logged in");
      } else throw new Error("Invalid response from server");
    } catch (err) {
      alert("Signup failed: " + err.message);
    }
  } else {
    // demo signup simply logs user in
    demoSignup(name, email);
  }
});

/* If token exists and backend is configured, try to fetch /me (optional) */
async function fetchProfileIfBackend() {
  if (!API_BASE) return;
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(API_BASE + "/api/auth/me", { headers: { "Authorization": "Bearer " + token } });
    if (res.ok) {
      const profile = await res.json();
      // do something with profile if needed (show avatar, name, etc.)
      console.log("Profile loaded", profile);
    } else {
      // token invalid -> clear
      tokenSet(null);
      updateAuthUI();
    }
  } catch (err) {
    console.error("Profile check failed", err);
  }
}
fetchProfileIfBackend();

/* Reveal animations */
document.addEventListener("DOMContentLoaded", () => {
  const reveals = document.querySelectorAll(".section-anim");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add("show");
        obs.unobserve(ent.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach(r => obs.observe(r));

  // slight stagger reveal for class cards
  const grid = document.getElementById("classGrid");
  if (grid) {
    const cards = grid.querySelectorAll(".class-card");
    const cardObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          cards.forEach((c, i) => setTimeout(() => c.classList.add("show"), i * 90));
          cardObs.disconnect();
        }
      });
    }, { threshold: 0.12 });
    if (cards.length) cardObs.observe(cards[0]);
  }

  // dynamic year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});

/* Accessibility / small helpers */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});