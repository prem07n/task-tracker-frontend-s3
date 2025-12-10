const COGNITO_DOMAIN = "us-east-1m4jv6n3ds.auth.us-east-1.amazoncognito.com";
const CLIENT_ID = "3grd2pmn0saj0u5mgfp8qj5r";
const RESPONSE_TYPE = "token";
const REDIRECT_URI = "https://task-tracker-2025.s3.us-east-1.amazonaws.com/index.html";
const SCOPE = "openid email";


// ---- Helpers ----
const $ = (sel) => document.querySelector(sel);
function buildLoginUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: RESPONSE_TYPE,
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
  });
  return `https://${COGNITO_DOMAIN}/login?${params.toString()}`;
}

function parseHash() {
  // For response_type=token, Cognito returns access_token/id_token in the URL hash
  if (!location.hash) return null;
  const hash = new URLSearchParams(location.hash.substring(1));
  const tokens = {
    access_token: hash.get("access_token"),
    id_token: hash.get("id_token"),
    expires_in: hash.get("expires_in"),
    token_type: hash.get("token_type"),
  };
  // Clear hash to keep URL neat
  history.replaceState({}, document.title, location.pathname);
  return (tokens.access_token || tokens.id_token) ? tokens : null;
}

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// ---- App State ----
const state = {
  tokens: null,
  tasks: JSON.parse(localStorage.getItem("tasks") || "[]"),
};

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(state.tasks));
}

function renderTasks() {
  const ul = $("#taskList");
  ul.innerHTML = "";
  state.tasks.forEach((t, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = t.text;
    span.className = "task-text";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = t.status;
    const del = document.createElement("button");
    del.className = "btn delete";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      state.tasks.splice(i, 1);
      saveTasks();
      renderTasks();
    });
    li.appendChild(span);
    li.appendChild(badge);
    li.appendChild(del);
    ul.appendChild(li);
  });
}

function setAuthUI() {
  const loginBtn = $("#loginBtn");
  const logoutBtn = $("#logoutBtn");
  const userInfo = $("#userInfo");
  const userEmail = $("#userEmail");

  if (state.tokens?.id_token) {
    const claims = decodeJwt(state.tokens.id_token) || {};
    userEmail.textContent = claims.email || "(no email in token)";
  }

  const loggedIn = Boolean(state.tokens);
  loginBtn.classList.toggle("hidden", loggedIn);
  logoutBtn.classList.toggle("hidden", !loggedIn);
  userInfo.classList.toggle("hidden", !loggedIn);
}

function initAuth() {
  // On load, try to parse tokens in hash
  const tokens = parseHash();
  if (tokens) {
    state.tokens = tokens;
    sessionStorage.setItem("tokens", JSON.stringify(tokens));
  } else {
    // Recover from prior session in this tab
    const saved = sessionStorage.getItem("tokens");
    if (saved) state.tokens = JSON.parse(saved);
  }
  setAuthUI();
}

// ---- Event wiring ----
window.addEventListener("DOMContentLoaded", () => {
  initAuth();
  renderTasks();

  $("#taskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#taskInput");
    const text = input.value.trim();
    if (!text) return;
    state.tasks.push({ text, status: "todo" });
    input.value = "";
    saveTasks();
    renderTasks();
  });

  $("#loginBtn").addEventListener("click", () => {
    window.location.href = buildLoginUrl();
  });

  $("#logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("tokens");
    state.tokens = null;
    setAuthUI();
  });
});
