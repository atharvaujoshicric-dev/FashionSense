/* ==========================================
   SHOP.JS — Shopping Suggestions with Images
   ========================================== */

let currentUser      = null;
let allShopItems     = [];
let currentFilter    = 'all';
let currentShopItem  = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;
  initAvatar(currentUser);

  const gender    = currentUser.gender || 'male';
  const genderKey = gender === 'nonbinary' ? 'nonbinary' : gender;
  const gData     = SHOP_ITEMS_2026[genderKey] || SHOP_ITEMS_2026.male;

  document.getElementById('shop-subtext').textContent =
    `Personalised picks for your ${gender} profile and 2026 wardrobe gaps.`;

  allShopItems = [
    ...gData.essential.map(i => ({ ...i, type: 'essential' })),
    ...gData.trending.map(i  => ({ ...i, type: 'trending'  })),
    ...gData.upgrade.map(i   => ({ ...i, type: 'upgrade'   }))
  ];

  renderShopGrid(allShopItems);

  document.getElementById('budget-tip-text').textContent =
    BUDGET_TIPS[Math.floor(Math.random() * BUDGET_TIPS.length)];
});

function filterShop(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderShopGrid(filter === 'all' ? allShopItems : allShopItems.filter(i => i.type === filter));
}

function renderShopGrid(items) {
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = `shop-card ${item.type}`;
    card.onclick   = () => openShopModal(item);

    const typeLabel = {
      essential: '⬡ Essential',
      trending:  '↑ Trending 2026',
      upgrade:   '✦ Upgrade'
    }[item.type] || '';

    const tagsHtml = (item.tags || [])
      .map(t => `<span class="shop-tag">${t}</span>`).join('');

    const imgUrl = getShopImageUrl(item);

    card.innerHTML = `
      <div class="shop-card-img-wrap">
        <img class="shop-card-img skeleton" src="${imgUrl}"
             alt="${item.name}"
             loading="lazy"
             onerror="this.src=''; this.parentElement.innerHTML='<div class=shop-card-img-fallback>${item.icon}</div>'"
             onload="this.classList.remove('skeleton')" />
        <div class="shop-card-type-badge ${item.type}">${typeLabel}</div>
      </div>
      <div class="shop-card-body">
        <div class="shop-card-name">${item.name}</div>
        <div class="shop-card-reason">${item.reason}</div>
        <div class="shop-card-tags">${tagsHtml}</div>
        <div class="shop-card-price">${item.price || ''}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openShopModal(item) {
  currentShopItem = item;

  const imgUrl = getShopImageUrl(item);
  const modalImg = document.getElementById('shop-modal-img');
  modalImg.src = imgUrl;
  modalImg.onerror = () => { modalImg.style.display = 'none'; };
  modalImg.style.display = 'block';

  const typeLabel = { essential:'⬡ Essential', trending:'↑ Trending 2026', upgrade:'✦ Upgrade' }[item.type] || '';
  document.getElementById('shop-modal-type').textContent   = typeLabel;
  document.getElementById('shop-modal-type').className     = `shop-modal-type ${item.type}`;
  document.getElementById('shop-modal-name').textContent   = item.name;
  document.getElementById('shop-modal-reason').textContent = item.reason;
  document.getElementById('shop-modal-price').textContent  = item.price ? `Price range: ${item.price}` : '';

  const tagsEl = document.getElementById('shop-modal-tags');
  tagsEl.innerHTML = (item.tags || []).map(t => `<span class="shop-tag">${t}</span>`).join('');

  document.getElementById('shop-item-modal').classList.remove('hidden');
}

function closeShopModal() {
  document.getElementById('shop-item-modal').classList.add('hidden');
  currentShopItem = null;
}

function searchOnline() {
  if (!currentShopItem) return;
  const query  = encodeURIComponent(currentShopItem.name + ' buy India 2026');
  window.open(`https://www.google.com/search?q=${query}&tbm=shop`, '_blank');
}

function getWardrobe(username) {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + username)) || []; }
  catch { return []; }
}
