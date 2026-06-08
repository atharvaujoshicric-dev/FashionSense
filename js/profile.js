/* ==========================================
   PROFILE.JS
   ========================================== */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  document.getElementById('profile-name-display').textContent = currentUser.name;
  document.getElementById('profile-username-display').textContent = '@' + currentUser.username;
  document.getElementById('p-name').value = currentUser.name;
  document.getElementById('avatar-circle').textContent = currentUser.name.charAt(0).toUpperCase();

  populateCitySelect('p-city', currentUser.city);

  // Pre-select pills
  ['gender', 'bodytype', 'faceshape'].forEach(type => {
    const keyMap = { gender: 'gender', bodytype: 'bodyType', faceshape: 'faceShape' };
    const val = currentUser[keyMap[type]];
    if (val) {
      const pill = document.querySelector(`#p-${type}-group .pill[data-val="${val}"]`);
      if (pill) pill.classList.add('active');
    }
  });

  // Body photo
  if (currentUser.bodyPhoto) {
    const img = document.getElementById('profile-body-photo-img');
    img.src = currentUser.bodyPhoto;
    img.classList.remove('hidden');
    document.getElementById('profile-body-photo-placeholder').style.display = 'none';
  }

  // Wardrobe stats
  renderStats();
});

function handleProfileBodyPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const img = document.getElementById('profile-body-photo-img');
    img.src = dataUrl;
    img.classList.remove('hidden');
    document.getElementById('profile-body-photo-placeholder').style.display = 'none';
    // Save immediately
    updateCurrentUser({ bodyPhoto: dataUrl });
    if (currentUser) currentUser.bodyPhoto = dataUrl;
    showToast('Body photo saved ✦');
  };
  reader.readAsDataURL(file);
}

function saveProfile() {
  const name      = document.getElementById('p-name').value.trim();
  const city      = document.getElementById('p-city').value;
  const gender    = getPillVal('p-gender-group');
  const bodyType  = getPillVal('p-bodytype-group');
  const faceShape = getPillVal('p-faceshape-group');

  if (!name) { showToast('Name cannot be empty', 'error'); return; }

  updateCurrentUser({ name, city, gender, bodyType, faceShape });
  showToast('Profile saved ✦');

  document.getElementById('profile-name-display').textContent = name;
  document.getElementById('avatar-circle').textContent = name.charAt(0).toUpperCase();
}

function getPillVal(groupId) {
  const el = document.getElementById(groupId);
  if (!el) return null;
  const a = el.querySelector('.pill.active');
  return a ? a.dataset.val : null;
}

function renderStats() {
  const wardrobe = getWardrobe(currentUser.username);
  const saved    = getSavedOutfits(currentUser.username);
  const cats     = {};
  wardrobe.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });

  const statsBox = document.getElementById('stats-box');
  statsBox.innerHTML = `
    <h4>Your Style Stats</h4>
    <div class="stats-grid">
      <div class="stat-card"><span class="stat-num">${wardrobe.length}</span><span class="stat-label">Wardrobe Items</span></div>
      <div class="stat-card"><span class="stat-num">${saved.length}</span><span class="stat-label">Saved Looks</span></div>
      <div class="stat-card"><span class="stat-num">${Object.keys(cats).length}</span><span class="stat-label">Categories</span></div>
      <div class="stat-card"><span class="stat-num">${calcStyleScore(wardrobe)}</span><span class="stat-label">Style Score</span></div>
    </div>
  `;
}

function calcStyleScore(wardrobe) {
  // Score based on wardrobe diversity
  const cats = new Set(wardrobe.map(i => i.category)).size;
  const colors = new Set(wardrobe.map(i => i.color)).size;
  const hasPhoto = wardrobe.filter(i => i.imageData).length;
  const score = Math.min(100, (cats * 10) + (colors * 5) + Math.min(30, hasPhoto * 3) + (wardrobe.length * 2));
  return score;
}

function getWardrobe(username) {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + username)) || []; }
  catch { return []; }
}

function getSavedOutfits(username) {
  try { return JSON.parse(localStorage.getItem('styleai_saved_outfits_' + username)) || []; }
  catch { return []; }
}
