/* ==========================================
   PROFILE.JS
   ========================================== */

let currentUser    = null;
let pendingBodyPhoto = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  document.getElementById('profile-name-display').textContent     = currentUser.name;
  document.getElementById('profile-username-display').textContent = '@' + currentUser.username;
  document.getElementById('p-name').value                         = currentUser.name;
  document.getElementById('avatar-circle').textContent            = currentUser.name.charAt(0).toUpperCase();

  populateCitySelect('p-city', currentUser.city);

  // Pre-select pills
  [
    { group: 'p-gender-group',   key: 'gender'    },
    { group: 'p-bodytype-group', key: 'bodyType'  },
    { group: 'p-faceshape-group',key: 'faceShape' }
  ].forEach(({ group, key }) => {
    const val = currentUser[key];
    if (val) {
      const pill = document.querySelector(`#${group} .pill[data-val="${val}"]`);
      if (pill) pill.classList.add('active');
    }
  });

  // Body photo
  if (currentUser.bodyPhoto) {
    _showBodyPhoto(currentUser.bodyPhoto);
    pendingBodyPhoto = currentUser.bodyPhoto;
  }

  renderStats();
});

function openProfileBodyPhotoPicker() {
  openPhotoPicker((dataUrl) => {
    if (!dataUrl) return;
    pendingBodyPhoto = dataUrl;
    _showBodyPhoto(dataUrl);
    document.getElementById('body-photo-status').classList.remove('hidden');
  }, {
    title: 'Full-Body Photo',
    hint:  'Stand straight, head to toe against a plain background. Used only for outfit try-on, stored on your device.'
  });
}

function _showBodyPhoto(dataUrl) {
  const img = document.getElementById('profile-body-photo-img');
  img.src   = dataUrl;
  img.classList.remove('hidden');
  document.getElementById('profile-body-photo-placeholder').style.display = 'none';
}

function saveProfile() {
  const name      = document.getElementById('p-name').value.trim();
  const city      = document.getElementById('p-city').value;
  const gender    = _getActivePill('p-gender-group');
  const bodyType  = _getActivePill('p-bodytype-group');
  const faceShape = _getActivePill('p-faceshape-group');

  if (!name) { showToast('Name cannot be empty', 'error'); return; }

  const updates = { name, city };
  if (gender)          updates.gender    = gender;
  if (bodyType)        updates.bodyType  = bodyType;
  if (faceShape)       updates.faceShape = faceShape;
  if (pendingBodyPhoto) updates.bodyPhoto = pendingBodyPhoto;

  updateCurrentUser(updates);
  currentUser = getCurrentUser(); // refresh local reference

  showToast('Profile saved ✦');
  document.getElementById('profile-name-display').textContent = name;
  document.getElementById('avatar-circle').textContent        = name.charAt(0).toUpperCase();
  document.getElementById('body-photo-status').classList.add('hidden');
}

function renderStats() {
  const wardrobe = _getWardrobe();
  const box = document.getElementById('stats-box');
  if (!box) return;
  if (wardrobe.length === 0) { box.style.display = 'none'; return; }

  const cats = {};
  wardrobe.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
  const emojiMap = { tops:'👕', bottoms:'👖', outerwear:'🧥', footwear:'👟', accessories:'⌚', ethnic:'🥻' };

  box.style.display = 'block';
  box.innerHTML = `
    <h4>Wardrobe — ${wardrobe.length} item${wardrobe.length !== 1 ? 's' : ''}</h4>
    ${Object.entries(cats).map(([cat, n]) =>
      `<div class="stat-row">
        <span>${emojiMap[cat] || '👗'} ${cat}</span>
        <span>${n} item${n > 1 ? 's' : ''}</span>
       </div>`
    ).join('')}
  `;
}

function _getWardrobe() {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + currentUser?.username)) || []; }
  catch { return []; }
}

function _getActivePill(groupId) {
  return document.querySelector(`#${groupId} .pill.active`)?.dataset.val || null;
}
