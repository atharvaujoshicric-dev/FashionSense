/* ==========================================
   PROFILE.JS
   ========================================== */

let _pUser  = null;
let _pPhoto = null;  // pending body photo base64

document.addEventListener('DOMContentLoaded', () => {
  _pUser = requireAuth();
  if (!_pUser) return;

  // Fill fields
  document.getElementById('profile-name-display').textContent     = _pUser.name;
  document.getElementById('profile-username-display').textContent = '@' + _pUser.username;
  document.getElementById('p-name').value = _pUser.name;
  document.getElementById('avatar-circle').textContent = _pUser.name.charAt(0).toUpperCase();

  populateCitySelect('p-city', _pUser.city);

  // Pills
  [
    ['p-gender-group',    'gender'   ],
    ['p-bodytype-group',  'bodyType' ],
    ['p-faceshape-group', 'faceShape']
  ].forEach(([groupId, key]) => {
    const val  = _pUser[key];
    const pill = val && document.querySelector('#' + groupId + ' .pill[data-val="' + val + '"]');
    if (pill) pill.classList.add('active');
  });

  // Body photo — already stored separately, loaded by getCurrentUser
  if (_pUser.bodyPhoto) {
    _showBodyPhoto(_pUser.bodyPhoto);
    _pPhoto = _pUser.bodyPhoto;
  }

  _renderStats();
});

// ── Body photo ────────────────────────────────────────────────────────────────

function openProfileBodyPhotoPicker() {
  openPhotoPicker(function(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      showToast('Photo could not be loaded', 'error');
      return;
    }
    _pPhoto = dataUrl;
    _showBodyPhoto(dataUrl);
    const status = document.getElementById('body-photo-status');
    if (status) status.classList.remove('hidden');
  }, {
    title: 'Full-Body Photo',
    hint:  'Stand straight from head to toe. Used only for outfit try-on — never leaves your device.'
  });
}

function _showBodyPhoto(dataUrl) {
  const img         = document.getElementById('profile-body-photo-img');
  const placeholder = document.getElementById('profile-body-photo-placeholder');
  if (!img) return;
  img.src = dataUrl;
  img.classList.remove('hidden');
  if (placeholder) placeholder.style.display = 'none';
}

// ── Save profile ──────────────────────────────────────────────────────────────

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

  // Always include bodyPhoto in updates (even if unchanged) so updateCurrentUser
  // writes it. Pass null explicitly if there's none, undefined means "don't touch".
  if (_pPhoto !== null) updates.bodyPhoto = _pPhoto;

  const result = updateCurrentUser(updates);
  _pUser = getCurrentUser(); // refresh with latest data including bodyPhoto

  showToast('Profile saved ✦');
  document.getElementById('profile-name-display').textContent = name;
  document.getElementById('avatar-circle').textContent        = name.charAt(0).toUpperCase();

  const status = document.getElementById('body-photo-status');
  if (status) status.classList.add('hidden');
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function _renderStats() {
  const box = document.getElementById('stats-box');
  if (!box) return;

  let items = [];
  try {
    const raw = localStorage.getItem('styleai_wardrobe_' + _pUser.username);
    items = raw ? JSON.parse(raw) : [];
  } catch {}

  if (items.length === 0) { box.style.display = 'none'; return; }

  const cats = {};
  items.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
  const em = { tops:'👕', bottoms:'👖', outerwear:'🧥', footwear:'👟', accessories:'⌚', ethnic:'🥻' };

  box.style.display = 'block';
  box.innerHTML = `
    <h4>Wardrobe — ${items.length} item${items.length !== 1 ? 's' : ''}</h4>
    ${Object.entries(cats).map(([cat, n]) =>
      `<div class="stat-row">
         <span>${em[cat] || '👗'} ${cat}</span>
         <span>${n} item${n > 1 ? 's' : ''}</span>
       </div>`
    ).join('')}
  `;
}

function _pill(groupId) {
  return document.querySelector('#' + groupId + ' .pill.active')?.dataset.val || null;
}
