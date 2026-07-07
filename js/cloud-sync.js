/* ==========================================
   CLOUD-SYNC.JS  (ES module — runs before DOMContentLoaded)
   ------------------------------------------
   - Verifies the Supabase session (real server-side auth).
   - Redirects to the login screen if there is no session on a
     protected page (anything under /pages/).
   - Pulls the user's profile, wardrobe, saved outfits and
     calendar from Supabase and mirrors them into localStorage
     under the SAME keys the existing pages already read, so
     wardrobe.js / outfit.js / calendar.js / analysis.js / etc.
     keep working completely unchanged.
   - Exposes window.cloudSync.push*() helpers that the write
     paths (wardrobe.js, outfit.js, calendar.js) call after every
     local save, so data is durable on the server, not just in
     one browser.
   - Gates pages behind an active subscription/trial. Because
     this is a <script type="module">, its top-level `await`
     delays DOMContentLoaded until hydration finishes — so
     requireAuth() in every page script can stay synchronous.
   ========================================== */

const PAGE_PATH = location.pathname;
const IS_PROTECTED = PAGE_PATH.includes('/pages/');
const CURRENT_FILE = PAGE_PATH.split('/').pop();
const ALWAYS_ALLOWED = ['profile.html', 'upgrade.html']; // reachable even without an active plan

function injectLoader(msg) {
  const el = document.createElement('div');
  el.id = 'cloud-sync-loader';
  el.style.cssText = `
    position:fixed; inset:0; z-index:99999; background:#15171c; color:#f2f3f5;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:10px; font:500 14px system-ui,sans-serif; letter-spacing:.02em;`;
  el.innerHTML = `<div style="width:26px;height:26px;border-radius:999px;border:3px solid rgba(242,243,245,.25);border-top-color:#4f63d2;animation:cs-spin 0.8s linear infinite"></div><div>${msg}</div>
    <style>@keyframes cs-spin{to{transform:rotate(360deg)}}</style>`;
  document.documentElement.appendChild(el);
  return el;
}
function removeLoader() {
  document.getElementById('cloud-sync-loader')?.remove();
}

const loader = injectLoader('Loading your wardrobe…');

function showFatalError(title, detail) {
  const el = document.getElementById('cloud-sync-loader');
  if (!el) return;
  el.innerHTML = `
    <div style="max-width:320px; text-align:center; padding:0 20px;">
      <div style="font-size:22px; margin-bottom:8px;">⚠️</div>
      <div style="font-weight:600; margin-bottom:6px;">${title}</div>
      <div style="font-size:12.5px; opacity:.75; line-height:1.5;">${detail}</div>
      <button onclick="location.reload()" style="margin-top:16px; background:#4f63d2; color:#fbfbfe; border:none; padding:9px 16px; border-radius:999px; font-weight:600; font-size:13px; cursor:pointer;">Retry</button>
      <div style="margin-top:10px;"><a href="${IS_PROTECTED ? '../index.html' : 'index.html'}" style="color:#f2f3f5; font-size:12px; text-decoration:underline;">Back to login</a></div>
    </div>`;
  window.__cloudSyncError = title;
}

async function hydrate() {
  if (!window.__supabaseConfigured) {
    showFatalError(
      'Supabase isn\u2019t connected yet',
      'Open js/supabase-client.js and paste in your Project URL and anon key from the Supabase dashboard (Settings \u2192 API), then reload.'
    );
    return;
  }

  let session;
  try {
    ({ data: { session } } = await window.supabaseClient.auth.getSession());
    if (!session && IS_PROTECTED) {
      // Rare race right after a fresh login/signup — give the SDK one more
      // beat to read the session it just persisted, instead of silently
      // bouncing back to the login screen.
      await new Promise((r) => setTimeout(r, 500));
      ({ data: { session } } = await window.supabaseClient.auth.getSession());
    }
  } catch (e) {
    showFatalError('Could not reach Supabase', 'Check your internet connection and that the URL in js/supabase-client.js is correct.');
    console.error(e);
    return;
  }

  if (!session) {
    if (IS_PROTECTED) {
      showFatalError(
        'You\u2019re not signed in',
        'No active session was found, so you were sent back to login. If you just registered or logged in and keep landing back here, open the browser console (F12) for details, and double-check "Confirm email" is OFF in Supabase → Authentication → Providers → Email.'
      );
      setTimeout(() => { window.location.href = '../index.html'; }, 2600);
      return;
    }
    removeLoader();
    return;
  }

  const uid = session.user.id;

  let profile, wardrobeRes, outfitsRes, calRes;
  try {
    let profileRes;
    [profileRes, wardrobeRes, outfitsRes, calRes] = await Promise.all([
      window.supabaseClient.from('profiles').select('*').eq('id', uid).maybeSingle(),
      window.supabaseClient.from('wardrobe').select('items').eq('user_id', uid).maybeSingle(),
      window.supabaseClient.from('saved_outfits').select('outfits').eq('user_id', uid).maybeSingle(),
      window.supabaseClient.from('calendar_entries').select('entries').eq('user_id', uid).maybeSingle(),
    ]);
    if (profileRes.error) throw profileRes.error;
    profile = profileRes.data;
  } catch (e) {
    showFatalError(
      'Could not load your account',
      'This usually means supabase/schema.sql hasn\u2019t been run yet in your Supabase project\u2019s SQL Editor. Details: ' + (e?.message || e)
    );
    console.error(e);
    return;
  }

  // The signup DB trigger creates these rows, but on a very fresh signup
  // there can be a brief race — retry once after a short pause.
  if (!profile) {
    await new Promise((r) => setTimeout(r, 900));
    ({ data: profile } = await window.supabaseClient.from('profiles').select('*').eq('id', uid).maybeSingle());
  }

  if (!profile) {
    showFatalError(
      'Your profile row is missing',
      'Signup succeeded but no profile was created. Make sure the "on_auth_user_created" trigger from supabase/schema.sql exists (SQL Editor \u2192 check for handle_new_user).'
    );
    return;
  }

  const p = profile || {};
  const now = Date.now();
  const trialActive = p.trial_ends_at ? new Date(p.trial_ends_at).getTime() > now : false;
  const subActive = !!p.subscription_active && (!p.subscription_expires_at || new Date(p.subscription_expires_at).getTime() > now);

  window.__currentUser = {
    id: uid,
    username: p.username || session.user.email?.split('@')[0] || 'user',
    name: p.name || '',
    city: p.city || 'Mumbai',
    gender: p.gender || null,
    bodyType: p.body_type || 'average',
    faceShape: p.face_shape || 'oval',
    bodyPhoto: p.body_photo_url || null,
    profilePhoto: p.profile_photo_url || null,
    avatarConfig: p.avatar_config || null,
    isDemo: !!p.is_demo,
    trialActive,
    subscriptionActive: subActive,
    trialEndsAt: p.trial_ends_at || null,
    subscriptionExpiresAt: p.subscription_expires_at || null,
    createdAt: p.created_at || null,
  };

  const uname = window.__currentUser.username;

  if (!wardrobeRes.error) {
    localStorage.setItem('styleai_wardrobe_' + uname, JSON.stringify(wardrobeRes.data?.items || []));
  } else {
    console.warn('[cloud-sync] wardrobe read failed — keeping whatever is cached locally', wardrobeRes.error);
  }
  if (!outfitsRes.error) {
    localStorage.setItem('styleai_saved_outfits_' + uname, JSON.stringify(outfitsRes.data?.outfits || []));
  } else {
    console.warn('[cloud-sync] saved_outfits read failed — keeping whatever is cached locally', outfitsRes.error);
  }
  if (!calRes.error) {
    localStorage.setItem('styleai_calendar_' + uname, JSON.stringify(calRes.data?.entries || []));
  } else {
    console.warn('[cloud-sync] calendar read failed — keeping whatever is cached locally', calRes.error);
  }

  // NOTE: subscription/trial status is still tracked (see window.__currentUser
  // .subscriptionActive / .trialActive) and pages/upgrade.html still works as
  // a dummy "Subscribe" flow you can test — it's just not required to use
  // the app. Re-enable enforcement later by uncommenting the block below.
  //
  // const hasAccess = !!p.is_demo || trialActive || subActive;
  // if (IS_PROTECTED && !hasAccess && !ALWAYS_ALLOWED.includes(CURRENT_FILE)) {
  //   window.location.href = 'upgrade.html';
  //   return;
  // }

  removeLoader();
}

await hydrate();

window.dispatchEvent(new Event('cloud-ready'));

window.cloudSync = {
  async pushWardrobe(_username, items) {
    if (!window.__currentUser) return false;
    const { error } = await window.supabaseClient
      .from('wardrobe')
      .upsert({ user_id: window.__currentUser.id, items, updated_at: new Date().toISOString() });
    if (error) { console.warn('[cloud-sync] wardrobe push failed', error); return false; }
    return true;
  },
  async pushSavedOutfits(_username, outfits) {
    if (!window.__currentUser) return false;
    const { error } = await window.supabaseClient
      .from('saved_outfits')
      .upsert({ user_id: window.__currentUser.id, outfits, updated_at: new Date().toISOString() });
    if (error) { console.warn('[cloud-sync] saved_outfits push failed', error); return false; }
    return true;
  },
  async pushCalendar(_username, entries) {
    if (!window.__currentUser) return false;
    const { error } = await window.supabaseClient
      .from('calendar_entries')
      .upsert({ user_id: window.__currentUser.id, entries, updated_at: new Date().toISOString() });
    if (error) { console.warn('[cloud-sync] calendar push failed', error); return false; }
    return true;
  },
  // Uploads a base64 dataURL to the "avatars" Storage bucket and returns a public URL.
  async uploadPhoto(dataUrl, kind) {
    if (!window.__currentUser) return null;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${window.__currentUser.id}/${kind}.jpg`;
      const { error } = await window.supabaseClient.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
      if (error) { console.warn('[cloud-sync] photo upload failed', error); return null; }
      const { data } = window.supabaseClient.storage.from('avatars').getPublicUrl(path);
      return data.publicUrl + '?t=' + Date.now();
    } catch (e) { console.warn('[cloud-sync] photo upload failed', e); return null; }
  },
};
