/* ==========================================
   DASHBOARD.JS
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth();
  if (!user) return;

  // Greeting
  const hour = new Date().getHours();
  document.getElementById('time-greeting').textContent =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  document.getElementById('user-greeting-name').textContent = user.name.split(' ')[0];

  // Body photo prompt
  if (!user.bodyPhoto) {
    document.getElementById('body-photo-prompt').classList.remove('hidden');
  }

  // Wardrobe + stats
  const wardrobe = getWardrobe(user.username);
  const saved    = getSavedOutfits(user.username);
  const score    = calcStyleScore(wardrobe);

  const countEl = document.getElementById('wardrobe-count');
  if (countEl) countEl.textContent = `${wardrobe.length} item${wardrobe.length !== 1 ? 's' : ''}`;

  document.getElementById('qs-items').textContent = wardrobe.length;
  document.getElementById('qs-saved').textContent = saved.length;
  document.getElementById('qs-score').textContent = score;

  renderTrendCards();
});

function renderTrendCards() {
  const container = document.getElementById('trend-cards');
  if (!container) return;
  TRENDS_2026.forEach(t => {
    const card = document.createElement('div');
    card.className = 'trend-card';
    card.innerHTML = `
      <div class="trend-card-emoji">${t.emoji}</div>
      <div class="trend-card-label">${t.label}</div>
      <div class="trend-card-name">${t.name}</div>
      <div class="trend-card-desc">${t.desc}</div>
    `;
    container.appendChild(card);
  });
}

function getWardrobe(username) {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + username)) || []; }
  catch { return []; }
}

function getSavedOutfits(username) {
  try { return JSON.parse(localStorage.getItem('styleai_saved_outfits_' + username)) || []; }
  catch { return []; }
}

function calcStyleScore(wardrobe) {
  const cats   = new Set(wardrobe.map(i => i.category)).size;
  const colors = new Set(wardrobe.map(i => i.color)).size;
  const photos = wardrobe.filter(i => i.imageData).length;
  return Math.min(100, (cats * 10) + (colors * 5) + Math.min(30, photos * 3) + (wardrobe.length * 2));
}

function checkBodyPhotoNudge(user) {
  const nudge = document.getElementById('body-photo-nudge');
  if (!nudge) return;
  if (!user.bodyPhoto) {
    nudge.classList.remove('hidden');
  }
}

function openDashboardBodyPhotoPicker() {
  openPhotoPicker(function(dataUrl) {
    const user = getCurrentUser();
    if (!user) return;
    updateCurrentUser({ bodyPhoto: dataUrl });
    document.getElementById('body-photo-nudge').classList.add('hidden');
    showToast('Photo saved! Go to Outfit to try on looks ✦');
  }, {
    title: 'Full-Body Photo',
    hint: 'Adds virtual try-on to your outfit suggestions. Stored privately on your device.'
  });
}
