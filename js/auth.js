/* ==========================================
   AUTH.JS — Authentication & User Management
   ========================================== */

const AUTH_KEY = 'styleai_users';
const SESSION_KEY = 'styleai_session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || {}; }
  catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!session) return null;
    const users = getUsers();
    return users[session.username] || null;
  } catch { return null; }
}

function setSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, ts: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function updateCurrentUser(updates) {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (!session) return;
  const users = getUsers();
  if (users[session.username]) {
    users[session.username] = { ...users[session.username], ...updates };
    saveUsers(users);
  }
}

// ---- Handlers ----

function handleLogin() {
  const username = document.getElementById('login-username')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const errEl = document.getElementById('login-error');

  if (!username || !password) {
    showError(errEl, 'Please fill in all fields.');
    return;
  }

  const users = getUsers();
  const user = users[username.toLowerCase()];

  if (!user || user.password !== btoa(password)) {
    showError(errEl, 'Invalid username or password.');
    return;
  }

  setSession(username.toLowerCase());
  window.location.href = 'pages/dashboard.html';
}

function handleRegister() {
  const name     = document.getElementById('reg-name')?.value.trim();
  const username = document.getElementById('reg-username')?.value.trim().toLowerCase();
  const password = document.getElementById('reg-password')?.value;
  const city     = document.getElementById('reg-city')?.value;
  const errEl    = document.getElementById('reg-error');

  const gender    = getSelectedPill('gender-group');
  const bodyType  = getSelectedPill('bodytype-group');
  const faceShape = getSelectedPill('faceshape-group');

  if (!name || !username || !password) {
    showError(errEl, 'Please fill your name, username and password.'); return;
  }
  if (username.length < 3) {
    showError(errEl, 'Username must be at least 3 characters.'); return;
  }
  if (password.length < 6) {
    showError(errEl, 'Password must be at least 6 characters.'); return;
  }
  if (!gender) {
    showError(errEl, 'Please select your gender.'); return;
  }

  const users = getUsers();
  if (users[username]) {
    showError(errEl, 'Username already taken. Try another.'); return;
  }

  users[username] = {
    name, username, password: btoa(password),
    city: city || 'Mumbai', gender, bodyType: bodyType || 'average',
    faceShape: faceShape || 'oval',
    createdAt: Date.now()
  };

  saveUsers(users);
  setSession(username);
  window.location.href = 'pages/dashboard.html';
}

function logout() {
  clearSession();
  const root = document.location.pathname.includes('/pages/') ? '../' : '';
  window.location.href = root + 'index.html';
}

function deleteAccount() {
  if (!confirm('Delete your account and all wardrobe data? This cannot be undone.')) return;
  const session = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (session) {
    const users = getUsers();
    delete users[session.username];
    saveUsers(users);
    // Also clear wardrobe
    localStorage.removeItem('styleai_wardrobe_' + session.username);
  }
  clearSession();
  window.location.href = '../index.html';
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
    return null;
  }
  return user;
}

// ---- Helpers ----

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function getSelectedPill(groupId) {
  const active = document.querySelector(`#${groupId} .pill.active`);
  return active ? active.dataset.val : null;
}
