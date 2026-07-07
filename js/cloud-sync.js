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
    position:fixed; inset:0; z-index:99999; background:#0f1210; color:#f1ece2;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:10px; font:500 14px system-ui,sans-serif; letter-spacing:.02em;`;
  el.innerHTML = `<div style="width:26px;height:26px;border-radius:999px;border:3px solid rgba(241,236,226,.25);border-top-color:#f1ece2;animation:cs-spin 0.8s linear infinite"></div><div>${msg}</div>
    <style>@keyframes cs-spin{to{transform:rotate(360deg)}}</style>`;
  document.documentElement.appendChild(el);
  return el;
}
function removeLoader() {
  document.getElementById('cloud-sync-loader')?.remove();
}

const loader = injectLoader('Loading your wardrobe…');

async function hydrate() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (!session) {
    if (IS_PROTECTED) { window.location.href = '../index.html'; return; }
    removeLoader();
    return;
  }

  const uid = session.user.id;

  let [{ data: profile }, { data: wardrobeRow }, { data: outfitsRow }, { data: calRow }] = await Promise.all([
    window.supabaseClient.from('profiles').select('*').eq('id', uid).maybeSingle(),
    window.supabaseClient.from('wardrobe').select('items').eq('user_id', uid).maybeSingle(),
    window.supabaseClient.from('saved_outfits').select('outfits').eq('user_id', uid).maybeSingle(),
    window.supabaseClient.from('calendar_entries').select('entries').eq('user_id', uid).maybeSingle(),
  ]);

  // The signup DB trigger creates these rows, but on a very fresh signup
  // there can be a brief race — retry once after a short pause.
  if (!profile) {
    await new Promise((r) => setTimeout(r, 900));
    ({ data: profile } = await window.supabaseClient.from('profiles').select('*').eq('id', uid).maybeSingle());
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
  localStorage.setItem('styleai_wardrobe_' + uname, JSON.stringify(wardrobeRow?.items || []));
  localStorage.setItem('styleai_saved_outfits_' + uname, JSON.stringify(outfitsRow?.outfits || []));
  localStorage.setItem('styleai_calendar_' + uname, JSON.stringify(calRow?.entries || []));

  const hasAccess = !!p.is_demo || trialActive || subActive;
  if (IS_PROTECTED && !hasAccess && !ALWAYS_ALLOWED.includes(CURRENT_FILE)) {
    window.location.href = 'upgrade.html';
    return;
  }

  removeLoader();
}

await hydrate();

window.dispatchEvent(new Event('cloud-ready'));

window.cloudSync = {
  async pushWardrobe(_username, items) {
    if (!window.__currentUser) return;
    const { error } = await window.supabaseClient
      .from('wardrobe')
      .upsert({ user_id: window.__currentUser.id, items, updated_at: new Date().toISOString() });
    if (error) console.warn('[cloud-sync] wardrobe push failed', error);
  },
  async pushSavedOutfits(_username, outfits) {
    if (!window.__currentUser) return;
    const { error } = await window.supabaseClient
      .from('saved_outfits')
      .upsert({ user_id: window.__currentUser.id, outfits, updated_at: new Date().toISOString() });
    if (error) console.warn('[cloud-sync] saved_outfits push failed', error);
  },
  async pushCalendar(_username, entries) {
    if (!window.__currentUser) return;
    const { error } = await window.supabaseClient
      .from('calendar_entries')
      .upsert({ user_id: window.__currentUser.id, entries, updated_at: new Date().toISOString() });
    if (error) console.warn('[cloud-sync] calendar push failed', error);
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
