/* ==========================================
   DASHBOARD.JS
   ========================================== */

let _dashUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  _dashUser = requireAuth();
  if (!_dashUser) return;
  initAvatar(_dashUser);

  // Greeting
  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  document.getElementById('time-greeting').textContent  = greet;
  document.getElementById('user-greeting-name').textContent = _dashUser.name.split(' ')[0];

  // Wardrobe count
  const wCount = document.getElementById('wardrobe-count');
  if (wCount) {
    const items = _getWardrobe();
    wCount.textContent = items.length + ' item' + (items.length !== 1 ? 's' : '');
  }

  // Theme button
  applyTheme(getTheme(), false);

  // Weather
  _loadWeather();

  // Trending cards
  _renderTrends();

  // Body photo nudge
  _checkBodyPhotoNudge();

  // Onboarding (first visit)
  checkOnboarding(_dashUser);
});

async function _loadWeather() {
  const el = document.getElementById('weather-widget');
  if (!el) return;

  el.innerHTML = '<div class="weather-loading">Fetching weather…</div>';

  try {
    const w = await fetchWeather(_dashUser.city || 'Mumbai');
    el.innerHTML = `
      <div class="weather-inner">
        <div class="weather-main">
          <div class="weather-temp">${w.temp}${w.unit}</div>
          <div class="weather-desc">${w.description}</div>
          <div class="weather-city">${w.city}${w.offline ? ' (estimate)' : ''}</div>
        </div>
        <div class="weather-advice">
          ${w.advice.map(a => `<div class="weather-advice-item">→ ${a}</div>`).join('')}
        </div>
      </div>
    `;
  } catch {
    el.innerHTML = '<div class="weather-loading">Weather unavailable</div>';
  }
}

function _renderTrends() {
  const container = document.getElementById('trend-cards');
  if (!container) return;
  TRENDS_2026.forEach(t => {
    const card = document.createElement('div');
    card.className = 'trend-card';
    card.innerHTML = `
      <div class="trend-card-emoji">${t.emoji}</div>
      <div class="trend-card-label">${t.label}</div>
      <div class="trend-card-name">${t.name}</div>
      <div class="trend-card-desc">${t.desc}</div>`;
    container.appendChild(card);
  });
}

function _checkBodyPhotoNudge() {
  const nudge = document.getElementById('body-photo-nudge');
  if (nudge && !_dashUser.bodyPhoto) nudge.classList.remove('hidden');
}

function openDashboardBodyPhotoPicker() {
  openPhotoPicker(function(dataUrl) {
    if (!dataUrl) return;
    updateCurrentUser({ bodyPhoto: dataUrl });
    const nudge = document.getElementById('body-photo-nudge');
    if (nudge) nudge.classList.add('hidden');
    showToast('Photo saved! Go to Outfit to try on looks ✦');
  }, {
    title: 'Full-Body Photo',
    hint:  'Adds virtual try-on to outfit suggestions. Stored only on your device.'
  });
}

function _getWardrobe() {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + _dashUser.username)) || []; }
  catch { return []; }
}
