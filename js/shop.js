/* ==========================================
   SHOP.JS — Shopping Suggestions
   ========================================== */

let currentUser = null;
let allShopItems = [];
let currentShopFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  const wardrobe = getWardrobe(currentUser.username);
  const gender = currentUser.gender || 'male';

  document.getElementById('shop-heading').textContent = `Your 2026 Style Picks`;
  document.getElementById('shop-subtext').textContent =
    `Curated picks based on your ${gender} profile and current wardrobe gaps.`;

  // Build shop items from data
  const genderKey = gender === 'nonbinary' ? 'nonbinary' : gender;
  const genderItems = SHOP_ITEMS_2026[genderKey] || SHOP_ITEMS_2026.male;

  allShopItems = [
    ...genderItems.essential.map(i => ({ ...i, type: 'essential' })),
    ...genderItems.trending.map(i => ({ ...i, type: 'trending' })),
    ...genderItems.upgrade.map(i => ({ ...i, type: 'upgrade' }))
  ];

  // Gap analysis — check what categories are missing
  const categories = wardrobe.map(i => i.category);
  const gapHints = [];
  if (!categories.includes('footwear')) gapHints.push("You're missing footwear in your wardrobe — a must-have category.");
  if (!categories.includes('outerwear')) gapHints.push("No outerwear added yet. A blazer or jacket elevates every outfit.");
  if (!categories.includes('accessories')) gapHints.push("Accessories are missing — a watch or belt completes any look.");
  if (categories.filter(c => c === 'tops').length < 3) gapHints.push("Your tops collection could use more variety.");
  if (categories.filter(c => c === 'bottoms').length < 2) gapHints.push("More bottoms will give you more combinations.");

  renderShopGrid(allShopItems);

  // Budget tip
  const budgetTip = BUDGET_TIPS[Math.floor(Math.random() * BUDGET_TIPS.length)];
  document.getElementById('budget-tip-text').textContent = budgetTip;
});

function filterShop(filter, btn) {
  currentShopFilter = filter;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const filtered = filter === 'all' ? allShopItems : allShopItems.filter(i => i.type === filter);
  renderShopGrid(filtered);
}

function renderShopGrid(items) {
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = `shop-card ${item.type}`;

    const tagsHtml = (item.tags || []).map(t => `<span class="shop-tag">${t}</span>`).join('');
    const typeLabel = item.type === 'essential' ? '⬡ Essential' : item.type === 'trending' ? '↑ Trending' : '✦ Upgrade';

    card.innerHTML = `
      <div class="shop-card-icon">${item.icon}</div>
      <div class="shop-card-info">
        <div class="shop-card-type">${typeLabel}</div>
        <div class="shop-card-name">${item.name}</div>
        <div class="shop-card-reason">${item.reason}</div>
        <div class="shop-card-price">${item.price || ''}</div>
        <div class="shop-card-tags">${tagsHtml}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function getWardrobe(username) {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + username)) || []; }
  catch { return []; }
}
