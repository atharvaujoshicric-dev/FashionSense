/* ==========================================
   AUTH.JS — Authentication & User Management
   ========================================== */

const AUTH_KEY    = 'styleai_users';
const SESSION_KEY = 'styleai_session';

// ── Demo account (always seeded) ─────────────────────────────────────────────
const DEMO_USER = {
  name:      'Demo User',
  username:  'demo',
  password:  btoa('demo123'),   // password: demo123
  city:      'Mumbai',
  gender:    'male',
  bodyType:  'athletic',
  faceShape: 'oval',
  isDemo:    true,
  createdAt: 0
};

function seedDemoAccount() {
  const users = getUsers();
  if (!users['demo']) {
    users['demo'] = DEMO_USER;
    saveUsers(users);
  }
}

// ── Storage helpers ───────────────────────────────────────────────────────────

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
    // Return updated user
    return users[session.username];
  }
}

// ── Auth handlers ─────────────────────────────────────────────────────────────

function handleLogin() {
  const usernameEl = document.getElementById('login-username');
  const passwordEl = document.getElementById('login-password');
  const errEl      = document.getElementById('login-error');

  const username = (usernameEl?.value || '').trim().toLowerCase();
  const password = (passwordEl?.value || '');

  if (!username || !password) {
    showAuthError(errEl, 'Please fill in all fields.'); return;
  }

  const users = getUsers();
  const user  = users[username];

  if (!user || user.password !== btoa(password)) {
    showAuthError(errEl, 'Invalid username or password.'); return;
  }

  setSession(username);
  window.location.href = 'pages/dashboard.html';
}

function handleRegister() {
  const name      = (document.getElementById('reg-name')?.value || '').trim();
  const username  = (document.getElementById('reg-username')?.value || '').trim().toLowerCase();
  const password  = (document.getElementById('reg-password')?.value || '');
  const city      = document.getElementById('reg-city')?.value || 'Mumbai';
  const errEl     = document.getElementById('reg-error');

  const gender    = getActivePillVal('gender-group');
  const bodyType  = getActivePillVal('bodytype-group');
  const faceShape = getActivePillVal('faceshape-group');

  if (!name)     { showAuthError(errEl, 'Please enter your full name.'); return; }
  if (!username) { showAuthError(errEl, 'Please choose a username.'); return; }
  if (username.length < 3) { showAuthError(errEl, 'Username must be at least 3 characters.'); return; }
  if (!password) { showAuthError(errEl, 'Please enter a password.'); return; }
  if (password.length < 6) { showAuthError(errEl, 'Password must be at least 6 characters.'); return; }
  if (!gender)   { showAuthError(errEl, 'Please select your gender.'); return; }

  if (username === 'demo') { showAuthError(errEl, '"demo" is reserved. Pick another username.'); return; }

  const users = getUsers();
  if (users[username]) { showAuthError(errEl, 'Username already taken. Try another.'); return; }

  users[username] = {
    name, username,
    password: btoa(password),
    city,
    gender,
    bodyType:  bodyType  || 'average',
    faceShape: faceShape || 'oval',
    createdAt: Date.now()
  };

  saveUsers(users);
  setSession(username);
  window.location.href = 'pages/dashboard.html';
}

function loginAsDemo() {
  seedDemoAccount();
  setSession('demo');
  window.location.href = 'pages/dashboard.html';
}

function logout() {
  clearSession();
  const isInPages = window.location.pathname.includes('/pages/');
  window.location.href = isInPages ? '../index.html' : 'index.html';
}

function deleteAccount() {
  const user = getCurrentUser();
  if (user?.isDemo) { showToast('Cannot delete demo account', 'error'); return; }
  if (!confirm('Delete your account and all wardrobe data? This cannot be undone.')) return;
  const session = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (session) {
    const users = getUsers();
    delete users[session.username];
    saveUsers(users);
    localStorage.removeItem('styleai_wardrobe_' + session.username);
    localStorage.removeItem('styleai_saved_outfits_' + session.username);
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function showAuthError(el, msg) {
  if (!el) { alert(msg); return; }
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function getActivePillVal(groupId) {
  const el = document.getElementById(groupId);
  if (!el) return null;
  const active = el.querySelector('.pill.active');
  return active ? active.dataset.val : null;
}

// ── Init ──────────────────────────────────────────────────────────────────────

// Seed demo account whenever auth.js loads
seedDemoAccount();
