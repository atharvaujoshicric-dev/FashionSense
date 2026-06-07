/* ==========================================
   DASHBOARD.JS
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth();
  if (!user) return;

  // Greeting
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  document.getElementById('time-greeting').textContent = timeGreet;
  document.getElementById('user-greeting-name').textContent = user.name.split(' ')[0];

  // Wardrobe count
  const wardrobe = getWardrobe(user.username);
  const countEl = document.getElementById('wardrobe-count');
  if (countEl) countEl.textContent = `${wardrobe.length} item${wardrobe.length !== 1 ? 's' : ''}`;

  // Trending cards
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
  try {
    return JSON.parse(localStorage.getItem('styleai_wardrobe_' + username)) || [];
  } catch { return []; }
}
