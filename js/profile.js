/* ==========================================
   PROFILE.JS
   ========================================== */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  // Fill profile
  document.getElementById('profile-name-display').textContent = currentUser.name;
  document.getElementById('profile-username-display').textContent = '@' + currentUser.username;
  document.getElementById('p-name').value = currentUser.name;
  document.getElementById('avatar-circle').textContent = currentUser.name.charAt(0).toUpperCase();

  populateCitySelect('p-city', currentUser.city);

  // Pre-select pills
  if (currentUser.gender) {
    const gpill = document.querySelector(`#p-gender-group .pill[data-val="${currentUser.gender}"]`);
    if (gpill) gpill.classList.add('active');
  }
  if (currentUser.bodyType) {
    const bpill = document.querySelector(`#p-bodytype-group .pill[data-val="${currentUser.bodyType}"]`);
    if (bpill) bpill.classList.add('active');
  }
  if (currentUser.faceShape) {
    const fpill = document.querySelector(`#p-faceshape-group .pill[data-val="${currentUser.faceShape}"]`);
    if (fpill) fpill.classList.add('active');
  }
});

function saveProfile() {
  const name       = document.getElementById('p-name').value.trim();
  const city       = document.getElementById('p-city').value;
  const gender     = getSelectedPill('p-gender-group');
  const bodyType   = getSelectedPill('p-bodytype-group');
  const faceShape  = getSelectedPill('p-faceshape-group');

  if (!name) { showToast('Name cannot be empty', 'error'); return; }

  updateCurrentUser({ name, city, gender, bodyType, faceShape });
  showToast('Profile saved ✦');

  document.getElementById('profile-name-display').textContent = name;
  document.getElementById('avatar-circle').textContent = name.charAt(0).toUpperCase();
}
