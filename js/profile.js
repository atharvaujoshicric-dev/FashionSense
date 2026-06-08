/* ==========================================
   PROFILE.JS
   ========================================== */

let currentUser = null;
let pendingBodyPhoto = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  document.getElementById('profile-name-display').textContent = currentUser.name;
  document.getElementById('profile-username-display').textContent = '@' + currentUser.username;
  document.getElementById('p-name').value = currentUser.name;
  document.getElementById('avatar-circle').textContent = currentUser.name.charAt(0).toUpperCase();

  populateCitySelect('p-city', currentUser.city);

  // Pre-select pills
  ['gender', 'bodytype', 'faceshape'].forEach(field => {
    const keyMap = { gender: 'gender', bodytype: 'bodyType', faceshape: 'faceShape' };
    const val = currentUser[keyMap[field]];
    if (val) {
      const pill = document.querySelector(`#p-${field}-group .pill[data-val="${val}"]`);
      if (pill) pill.classList.add('active');
    }
  });

  // Body photo
  if (currentUser.bodyPhoto) {
    const img = document.getElementById('profile-body-photo-img');
    img.src = currentUser.bodyPhoto;
    img.classList.remove('hidden');
    document.getElementById('profile-body-photo-placeholder').style.display = 'none';
    pendingBodyPhoto = currentUser.bodyPhoto;
  }

  // Stats
  renderStats();
});

function openProfileBodyPhotoPicker() {
  openPhotoPicker((dataUrl) => {
    pendingBodyPhoto = dataUrl;
    const img = document.getElementById('profile-body-photo-img');
    img.src   = dataUrl;
    img.classList.remove('hidden');
    document.getElementById('profile-body-photo-placeholder').style.display = 'none';
    showToast('Photo added — tap ✓ to save');
  }, {
    title: 'Full-Body Photo',
    hint:  'Stand straight, full length from head to toe. Used for virtual try-on only — stored locally.'
  });
}

function saveProfile() {
  const name      = document.getElementById('p-name').value.trim();
  const city      = document.getElementById('p-city').value;
  const gender    = getActivePillVal('p-gender-group');
  const bodyType  = getActivePillVal('p-bodytype-group');
  const faceShape = getActivePillVal('p-faceshape-group');

  if (!name) { showToast('Name cannot be empty', 'error'); return; }

  const updates = { name, city };
  if (gender)    updates.gender    = gender;
  if (bodyType)  updates.bodyType  = bodyType;
  if (faceShape) updates.faceShape = faceShape;
  if (pendingBodyPhoto) updates.bodyPhoto = pendingBodyPhoto;

  updateCurrentUser(updates);
  showToast('Profile saved ✦');

  document.getElementById('profile-name-display').textContent = name;
  document.getElementById('avatar-circle').textContent = name.charAt(0).toUpperCase();
}

function renderStats() {
  const wardrobe = getWardrobeForUser(currentUser.username);
  const cats = {};
  wardrobe.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });

  const box = document.getElementById('stats-box');
  if (!box) return;
  if (wardrobe.length === 0) { box.style.display = 'none'; return; }

  const emojiMap = { tops:'👕', bottoms:'👖', outerwear:'🧥', footwear:'👟', accessories:'⌚', ethnic:'🥻' };
  const rows = Object.entries(cats).map(([cat, count]) =>
    `<div class="stat-row"><span>${emojiMap[cat] || '👗'} ${cat}</span><span>${count} item${count>1?'s':''}</span></div>`
  ).join('');

  box.innerHTML = `
    <h4>Wardrobe (${wardrobe.length} items)</h4>
    ${rows}
  `;
}

function getWardrobeForUser(username) {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + username)) || []; }
  catch { return []; }
}

function getActivePillVal(groupId) {
  const el = document.getElementById(groupId);
  if (!el) return null;
  const a = el.querySelector('.pill.active');
  return a ? a.dataset.val : null;
}
