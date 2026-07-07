/* ==========================================
   AUTH.JS — Authentication (Supabase-backed)
   ------------------------------------------
   Real server-side auth: Supabase hashes and checks passwords,
   issues a JWT session, and Postgres Row Level Security makes
   sure a user can only ever read/write their OWN rows — none of
   that was true of the old localStorage version.

   The UI still only asks for a "username" (no email field), so
   under the hood each username maps to a synthetic address
   "<username>@styleai.local". That keeps every existing screen
   working unchanged. Swap this for real email collection later
   if you want password-reset emails to work.
   ========================================== */

function _emailForUsername(username) {
  return username.toLowerCase().trim() + '@styleai.local';
}

// ── Session-derived user (populated by cloud-sync.js before this runs) ────────

function getCurrentUser() {
  return window.__currentUser || null;
}

function requireAuth() {
  if (window.__cloudSyncError) return null; // error banner is already showing; don't redirect over it
  if (!window.__currentUser) {
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? '../index.html' : 'index.html';
    return null;
  }
  return window.__currentUser;
}

// ── Profile updates (photos go to Supabase Storage, fields to `profiles`) ─────

async function updateCurrentUser(updates) {
  if (!window.__currentUser) return null;
  const { bodyPhoto, profilePhoto, avatarConfig, ...rest } = updates;
  const dbPatch = {};

  if (rest.name !== undefined) dbPatch.name = rest.name;
  if (rest.city !== undefined) dbPatch.city = rest.city;
  if (rest.gender !== undefined) dbPatch.gender = rest.gender;
  if (rest.bodyType !== undefined) dbPatch.body_type = rest.bodyType;
  if (rest.faceShape !== undefined) dbPatch.face_shape = rest.faceShape;
  if (avatarConfig !== undefined) dbPatch.avatar_config = avatarConfig;

  if (bodyPhoto !== undefined) {
    const url = bodyPhoto ? await window.cloudSync.uploadPhoto(bodyPhoto, 'body') : null;
    dbPatch.body_photo_url = url;
    window.__currentUser.bodyPhoto = url || bodyPhoto;
    if (!url && bodyPhoto && typeof showToast === 'function') showToast('Photo saved on this device only — upload to cloud failed', 'error');
  }
  if (profilePhoto !== undefined) {
    const url = profilePhoto ? await window.cloudSync.uploadPhoto(profilePhoto, 'profile') : null;
    dbPatch.profile_photo_url = url;
    window.__currentUser.profilePhoto = url || profilePhoto;
    if (!url && profilePhoto && typeof showToast === 'function') showToast('Photo saved on this device only — upload to cloud failed', 'error');
  }

  Object.assign(window.__currentUser, rest, avatarConfig !== undefined ? { avatarConfig } : {});

  if (Object.keys(dbPatch).length) {
    const { error } = await window.supabaseClient.from('profiles').update(dbPatch).eq('id', window.__currentUser.id);
    if (error) console.warn('updateCurrentUser failed:', error);
  }
  return window.__currentUser;
}

// ── Auth handlers ─────────────────────────────────────────────────────────────

async function handleLogin() {
  const username = (document.getElementById('login-username')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('login-password')?.value || '');
  const errEl    = document.getElementById('login-error');

  if (!username || !password) { showAuthError(errEl, 'Please fill in all fields.'); return; }

  const { error } = await window.supabaseClient.auth.signInWithPassword({
    email: _emailForUsername(username), password,
  });
  if (error) {
    const msg = /confirm/i.test(error.message)
      ? 'This account needs email confirmation turned off — in Supabase go to Authentication → Providers → Email and disable "Confirm email".'
      : 'Invalid username or password.';
    showAuthError(errEl, msg);
    return;
  }

  window.location.href = 'pages/dashboard.html';
}

async function handleRegister() {
  const name     = (document.getElementById('reg-name')?.value     || '').trim();
  const username = (document.getElementById('reg-username')?.value || '').trim().toLowerCase();
  const password = (document.getElementById('reg-password')?.value || '');
  const city     = document.getElementById('reg-city')?.value || 'Mumbai';
  const errEl    = document.getElementById('reg-error');

  const gender    = getActivePillVal('gender-group');
  const bodyType  = getActivePillVal('bodytype-group');
  const faceShape = getActivePillVal('faceshape-group');

  if (!name)               { showAuthError(errEl, 'Please enter your full name.');         return; }
  if (!username)           { showAuthError(errEl, 'Please choose a username.');             return; }
  if (username.length < 3) { showAuthError(errEl, 'Username must be at least 3 characters.'); return; }
  if (!password)           { showAuthError(errEl, 'Please enter a password.');              return; }
  if (password.length < 6) { showAuthError(errEl, 'Password must be at least 6 characters.'); return; }
  if (!gender)             { showAuthError(errEl, 'Please select your gender.');            return; }
  if (username === 'demo') { showAuthError(errEl, '"demo" is reserved. Pick another.'); return; }

  const { data, error } = await window.supabaseClient.auth.signUp({
    email: _emailForUsername(username),
    password,
    options: {
      data: {
        username, name, city, gender,
        bodyType: bodyType || 'average',
        faceShape: faceShape || 'oval',
        isDemo: false,
      },
    },
  });

  if (error) {
    const msg = /registered|exists/i.test(error.message) ? 'Username already taken.' : error.message;
    showAuthError(errEl, msg);
    return;
  }

  if (!data.session) {
    showAuthError(errEl, 'Account created, but sign-in didn\u2019t start automatically. In Supabase go to Authentication → Providers → Email and turn OFF "Confirm email", then try logging in.');
    return;
  }

  window.location.href = 'pages/dashboard.html';
}

async function loginAsDemo() {
  const email = _emailForUsername('demo');
  let { error } = await window.supabaseClient.auth.signInWithPassword({ email, password: 'demo123' });

  if (error) {
    // First time — seed the demo account, then log in.
    const signUp = await window.supabaseClient.auth.signUp({
      email, password: 'demo123',
      options: {
        data: {
          username: 'demo', name: 'Demo User', city: 'Mumbai',
          gender: 'male', bodyType: 'athletic', faceShape: 'oval', isDemo: true,
        },
      },
    });
    if (signUp.error) { alert('Demo account is unavailable right now. Please try again shortly.'); return; }
    if (!signUp.data.session) {
      alert('Demo account created, but sign-in didn\u2019t start automatically. In Supabase go to Authentication → Providers → Email and turn OFF "Confirm email", then tap Demo Login again.');
      return;
    }
  }

  window.location.href = 'pages/dashboard.html';
}

async function logout() {
  await window.supabaseClient.auth.signOut();
  window.__currentUser = null;
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? '../index.html' : 'index.html';
}

async function deleteAccount() {
  const user = window.__currentUser;
  if (!user) return;
  if (user.isDemo) { if (typeof showToast === 'function') showToast('Cannot delete demo account', 'error'); return; }
  if (!confirm('Delete your account and all data? This cannot be undone.')) return;

  await window.supabaseClient.from('wardrobe').delete().eq('user_id', user.id);
  await window.supabaseClient.from('saved_outfits').delete().eq('user_id', user.id);
  await window.supabaseClient.from('calendar_entries').delete().eq('user_id', user.id);
  await window.supabaseClient.from('profiles').delete().eq('id', user.id);
  await window.supabaseClient.auth.signOut();
  // Note: this removes the user's profile & data. Fully deleting the underlying
  // auth.users record needs the service-role key, used from a server or a
  // Supabase Edge Function — never from client-side code. See SETUP.md.

  window.__currentUser = null;
  window.location.href = '../index.html';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function showAuthError(el, msg) {
  if (!el) { alert(msg); return; }
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function getActivePillVal(groupId) {
  return document.querySelector('#' + groupId + ' .pill.active')?.dataset.val || null;
}
