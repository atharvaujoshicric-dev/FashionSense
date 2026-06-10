/* ==========================================
   PROFILE.JS
   ========================================== */

let _pUser        = null;
let _pPhoto       = null;   // pending body photo
let _pProfilePhoto= null;   // pending profile photo

document.addEventListener('DOMContentLoaded', () => {
  _pUser = requireAuth();
  if (!_pUser) return;

  initPageAvatar(_pUser);
  _fillForm();
  _loadProfilePhoto();
  _loadBodyPhoto();
  _renderAvatarPreview();
  _renderStats();
});

// ── Fill form ─────────────────────────────────────────────────────────────────

function _fillForm() {
  document.getElementById('profile-name-display').textContent     = _pUser.name;
  document.getElementById('profile-username-display').textContent = '@' + _pUser.username;
  document.getElementById('p-name').value = _pUser.name;
  populateCitySelect('p-city', _pUser.city);

  [['p-gender-group','gender'],['p-bodytype-group','bodyType'],['p-faceshape-group','faceShape']]
    .forEach(([g,k]) => {
      const v = _pUser[k];
      if (v) document.querySelector('#'+g+' .pill[data-val="'+v+'"]')?.classList.add('active');
    });
}

// ── Profile photo ─────────────────────────────────────────────────────────────

function _loadProfilePhoto() {
  const img      = document.getElementById('profile-photo-display');
  const initials = document.getElementById('profile-photo-initials-lg');
  if (_pUser.profilePhoto) {
    img.src = _pUser.profilePhoto;
    img.classList.remove('hidden');
    if (initials) initials.style.display = 'none';
  } else {
    img.classList.add('hidden');
    if (initials) initials.textContent = _pUser.name.charAt(0).toUpperCase();
  }
}

function changeProfilePhoto() {
  openPhotoPicker(async function(dataUrl) {
    if (!dataUrl) return;
    _pProfilePhoto = dataUrl;

    // Immediately show new photo
    const img      = document.getElementById('profile-photo-display');
    const initials = document.getElementById('profile-photo-initials-lg');
    img.src = dataUrl;
    img.classList.remove('hidden');
    if (initials) initials.style.display = 'none';

    // Persist immediately (don't wait for save button)
    await updateProfilePhoto(dataUrl);
    showToast('Profile photo updated ✦');

    // Refresh avatar with new photo colors
    _renderAvatarPreview();
  }, {
    title:  'Profile Photo',
    hint:   'Your face photo — used to detect skin & hair tone for your cartoon avatar.'
  });
}

// ── Body photo ────────────────────────────────────────────────────────────────

function _loadBodyPhoto() {
  if (_pUser.bodyPhoto) {
    _showBodyPhoto(_pUser.bodyPhoto);
    _pPhoto = _pUser.bodyPhoto;
  }
}

function openProfileBodyPhotoPicker() {
  openPhotoPicker(function(dataUrl) {
    if (!dataUrl) return;
    _pPhoto = dataUrl;
    _showBodyPhoto(dataUrl);
    document.getElementById('body-photo-status').classList.remove('hidden');
  }, {
    title: 'Full-Body Photo',
    hint:  'Head to toe, standing straight. Used for virtual try-on — stored only on device.'
  });
}

function _showBodyPhoto(dataUrl) {
  const img = document.getElementById('profile-body-photo-img');
  img.src   = dataUrl;
  img.classList.remove('hidden');
  document.getElementById('profile-body-photo-placeholder').style.display = 'none';
}

// ── Avatar preview ────────────────────────────────────────────────────────────

async function _renderAvatarPreview() {
  const stage = document.getElementById('profile-avatar-stage');
  if (!stage) return;
  const user = getCurrentUser();
  if (!user) return;
  await renderAvatarInto(stage, user, {});
}

// ── Save ──────────────────────────────────────────────────────────────────────

function saveProfile() {
  const name      = (document.getElementById('p-name').value || '').trim();
  const city      = document.getElementById('p-city').value;
  const gender    = _pill('p-gender-group');
  const bodyType  = _pill('p-bodytype-group');
  const faceShape = _pill('p-faceshape-group');

  if (!name) { showToast('Name cannot be empty', 'error'); return; }

  const updates = { name, city };
  if (gender)    updates.gender    = gender;
  if (bodyType)  updates.bodyType  = bodyType;
  if (faceShape) updates.faceShape = faceShape;
  if (_pPhoto)   updates.bodyPhoto = _pPhoto;

  updateCurrentUser(updates);
  _pUser = getCurrentUser();

  showToast('Profile saved ✦');
  document.getElementById('profile-name-display').textContent = name;
  document.getElementById('body-photo-status').classList.add('hidden');

  // Refresh avatar in case body type / gender changed
  _renderAvatarPreview();
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function _renderStats() {
  const box = document.getElementById('stats-box');
  if (!box) return;
  let items = [];
  try { items = JSON.parse(localStorage.getItem('styleai_wardrobe_' + _pUser.username)) || []; } catch {}
  if (items.length === 0) return;

  const cats = {};
  items.forEach(i => { cats[i.category] = (cats[i.category]||0)+1; });
  const em = {tops:'👕',bottoms:'👖',outerwear:'🧥',footwear:'👟',accessories:'⌚',ethnic:'🥻'};

  box.style.display = 'block';
  box.innerHTML = `<h4>Wardrobe — ${items.length} item${items.length!==1?'s':''}</h4>
    ${Object.entries(cats).map(([c,n]) =>
      `<div class="stat-row"><span>${em[c]||'👗'} ${c}</span><span>${n}</span></div>`
    ).join('')}`;
}

function _pill(g) {
  return document.querySelector('#'+g+' .pill.active')?.dataset.val || null;
}
