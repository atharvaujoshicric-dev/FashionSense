/* ==========================================
   AUTH.JS — Authentication & User Management
   ========================================== */

const AUTH_KEY    = 'styleai_users';
const SESSION_KEY = 'styleai_session';

// Body photo is stored separately (it's a large base64 image — storing it
// inside the users object would blow the 5MB localStorage quota)
function _bodyPhotoKey(username) { return 'styleai_body_photo_' + username; }

// ── Demo account ──────────────────────────────────────────────────────────────
const DEMO_USER = {
  name: 'Demo User', username: 'demo',
  password: btoa('demo123'),
  city: 'Mumbai', gender: 'male', bodyType: 'athletic', faceShape: 'oval',
  isDemo: true, createdAt: 0
};

function seedDemoAccount() {
  const users = getUsers();
  if (!users['demo']) { users['demo'] = DEMO_USER; saveUsers(users); }
}

// ── Storage ───────────────────────────────────────────────────────────────────

function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || {}; }
  catch { return {}; }
}

function saveUsers(users) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(users)); }
  catch (e) { console.warn('saveUsers failed:', e); }
}

function getCurrentUser() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!session) return null;
    const users = getUsers();
    const user  = users[session.username];
    if (!user) return null;
    // Attach body photo from its own key (not stored in users object)
    user.bodyPhoto = localStorage.getItem(_bodyPhotoKey(user.username)) || null;
    return user;
  } catch { return null; }
}

function setSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, ts: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * updateCurrentUser — updates profile fields.
 * bodyPhoto is handled separately to avoid quota issues.
 */
function updateCurrentUser(updates) {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  if (!session) return null;

  const users = getUsers();
  if (!users[session.username]) return null;

  // Pull out bodyPhoto before merging into users object
  const { bodyPhoto, ...profileUpdates } = updates;

  // Save body photo to its own key
  if (bodyPhoto !== undefined) {
    try {
      if (bodyPhoto) {
        localStorage.setItem(_bodyPhotoKey(session.username), bodyPhoto);
      } else {
        localStorage.removeItem(_bodyPhotoKey(session.username));
      }
    } catch (e) {
      // Photo too large even for its own key — rare
      console.warn('Body photo storage failed:', e);
      if (typeof showToast === 'function') {
        showToast('Photo too large — try a smaller image', 'error');
      }
    }
  }

  // Save remaining profile fields
  if (Object.keys(profileUpdates).length > 0) {
    users[session.username] = { ...users[session.username], ...profileUpdates };
    saveUsers(users);
  }

  return getCurrentUser(); // return the updated user (with bodyPhoto attached)
}

// ── Auth handlers ─────────────────────────────────────────────────────────────

function handleLogin() {
  const username = (document.getElementById('login-username')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('login-password')?.value || '');
  const errEl    = document.getElementById('login-error');

  if (!username || !password) { showAuthError(errEl, 'Please fill in all fields.'); return; }

  const users = getUsers();
  const user  = users[username];
  if (!user || user.password !== btoa(password)) {
    showAuthError(errEl, 'Invalid username or password.'); return;
  }

  setSession(username);
  window.location.href = 'pages/dashboard.html';
}

function handleRegister() {
  const name     = (document.getElementById('reg-name')?.value     || '').trim();
  const username = (document.getElementById('reg-username')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('reg-password')?.value || '');
  const city     = document.getElementById('reg-city')?.value || 'Mumbai';
  const errEl    = document.getElementById('reg-error');

  const gender    = getActivePillVal('gender-group');
  const bodyType  = getActivePillVal('bodytype-group');
  const faceShape = getActivePillVal('faceshape-group');

  if (!name)              { showAuthError(errEl, 'Please enter your full name.'); return; }
  if (!username)          { showAuthError(errEl, 'Please choose a username.');    return; }
  if (username.length < 3){ showAuthError(errEl, 'Username must be at least 3 characters.'); return; }
  if (!password)          { showAuthError(errEl, 'Please enter a password.');     return; }
  if (password.length < 6){ showAuthError(errEl, 'Password must be at least 6 characters.'); return; }
  if (!gender)            { showAuthError(errEl, 'Please select your gender.');   return; }
  if (username === 'demo'){ showAuthError(errEl, '"demo" is reserved. Pick another username.'); return; }

  const users = getUsers();
  if (users[username])    { showAuthError(errEl, 'Username already taken.'); return; }

  users[username] = {
    name, username, password: btoa(password),
    city, gender,
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
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? '../index.html' : 'index.html';
}

function deleteAccount() {
  const user = getCurrentUser();
  if (user?.isDemo) { if(typeof showToast==='function') showToast('Cannot delete demo account','error'); return; }
  if (!confirm('Delete your account and all data? This cannot be undone.')) return;
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  if (session) {
    const users = getUsers();
    delete users[session.username];
    saveUsers(users);
    localStorage.removeItem('styleai_wardrobe_'      + session.username);
    localStorage.removeItem('styleai_saved_outfits_' + session.username);
    localStorage.removeItem(_bodyPhotoKey(session.username));
  }
  clearSession();
  window.location.href = '../index.html';
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) { window.location.href = '../index.html'; return null; }
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
  return document.querySelector(`#${groupId} .pill.active`)?.dataset.val || null;
}

// Seed demo on load
seedDemoAccount();
