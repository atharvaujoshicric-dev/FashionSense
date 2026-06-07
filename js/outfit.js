/* ==========================================
   OUTFIT.JS — Outfit Suggester Page
   ========================================== */

let currentUser = null;
let currentOccasion = 'casual';
let currentCity = '';
let currentOutfit = null;
let swapSlotRole = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;

  currentCity = currentUser.city || 'Mumbai';
  document.getElementById('outfit-city-label').textContent = currentCity;

  // Populate city picker
  populateCitySelect('city-picker-select', currentCity);
});

function selectOccasion(occ, btn) {
  currentOccasion = occ;
  document.querySelectorAll('.occ-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ---- Generate ----

function generateOutfit() {
  const wardrobe = getWardrobe(currentUser.username);

  if (wardrobe.length < 2) {
    document.getElementById('no-wardrobe-warning').classList.remove('hidden');
    document.getElementById('outfit-result').classList.add('hidden');
    return;
  }

  document.getElementById('no-wardrobe-warning').classList.add('hidden');

  const result = generateOutfitSuggestion(wardrobe, currentUser, currentOccasion, currentCity);

  if (!result) {
    showToast('Not enough clothes for this occasion. Try adding more!', 'error');
    return;
  }

  currentOutfit = result;
  renderOutfitResult(result);
}

function renderOutfitResult(result) {
  const resultEl = document.getElementById('outfit-result');
  resultEl.classList.remove('hidden');

  document.getElementById('outfit-name').textContent = result.outfitName;
  document.getElementById('outfit-desc').textContent = result.outfitDesc;

  // Slots
  const slotsEl = document.getElementById('outfit-slots');
  slotsEl.innerHTML = '';
  result.slots.forEach(slot => {
    const el = document.createElement('div');
    el.className = 'outfit-slot';
    el.onclick = () => openSwapModal(slot.role);

    const imgHtml = slot.item.imageData
      ? `<div class="slot-img"><img src="${slot.item.imageData}" /></div>`
      : `<div class="slot-img">${getCategoryEmoji(slot.item.category)}</div>`;

    el.innerHTML = `
      ${imgHtml}
      <div class="slot-info">
        <div class="slot-category">${slot.label}</div>
        <div class="slot-name">${slot.item.subtype}</div>
        <div class="slot-color">${capitalise(slot.item.color)} · ${slot.item.pattern}</div>
      </div>
      <button class="slot-swap-btn" onclick="event.stopPropagation(); openSwapModal('${slot.role}')">Swap</button>
    `;
    slotsEl.appendChild(el);
  });

  // Styling tips
  const tipsList = document.getElementById('styling-tips-list');
  tipsList.innerHTML = '';
  result.tips.forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    tipsList.appendChild(li);
  });

  // Palette
  const swatches = document.getElementById('palette-swatches');
  swatches.innerHTML = '';
  result.palette.hexes.forEach(hex => {
    const sw = document.createElement('div');
    sw.className = 'palette-swatch';
    sw.style.backgroundColor = hex;
    swatches.appendChild(sw);
  });
  document.getElementById('palette-desc').textContent = result.palette.desc;

  // Scroll to result
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- Swap Modal ----

function openSwapModal(role) {
  swapSlotRole = role;
  const roleToCategory = {
    top: ['tops', 'ethnic'],
    bottom: ['bottoms', 'ethnic'],
    outerwear: ['outerwear'],
    footwear: ['footwear'],
    accessory: ['accessories']
  };

  const allowedCats = roleToCategory[role] || ['tops'];
  const wardrobe = getWardrobe(currentUser.username);
  const options = wardrobe.filter(i => allowedCats.includes(i.category));

  document.getElementById('swap-modal-title').textContent = `Swap ${capitalise(role)}`;

  const grid = document.getElementById('swap-grid');
  grid.innerHTML = '';

  if (options.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);padding:1rem;grid-column:1/-1">No items in this category</p>';
  } else {
    options.forEach(item => {
      const el = document.createElement('div');
      el.className = 'swap-item';
      el.onclick = () => swapItem(item);

      // Check if currently selected
      const currentSlot = currentOutfit?.slots.find(s => s.role === role);
      if (currentSlot?.item.id === item.id) el.classList.add('selected');

      if (item.imageData) {
        el.innerHTML = `<img src="${item.imageData}" />`;
      } else {
        el.textContent = getCategoryEmoji(item.category);
      }
      grid.appendChild(el);
    });
  }

  document.getElementById('swap-modal').classList.remove('hidden');
}

function closeSwapModal() {
  document.getElementById('swap-modal').classList.add('hidden');
  swapSlotRole = null;
}

function swapItem(newItem) {
  if (!swapSlotRole || !currentOutfit) return;

  const slot = currentOutfit.slots.find(s => s.role === swapSlotRole);
  if (slot) {
    slot.item = newItem;
    // Rebuild palette
    currentOutfit.palette = buildPalette(currentOutfit.slots);
  }

  closeSwapModal();
  renderOutfitResult(currentOutfit);
  showToast('Outfit updated ✦');
}

// ---- City ----

function showCityPicker() {
  document.getElementById('city-modal').classList.remove('hidden');
}

function closeCityModal() {
  document.getElementById('city-modal').classList.add('hidden');
}

function applyCity() {
  const sel = document.getElementById('city-picker-select');
  currentCity = sel.value;
  document.getElementById('outfit-city-label').textContent = currentCity;
  closeCityModal();
  showToast(`City updated to ${currentCity}`);
}

// ---- Helpers ----

function getCategoryEmoji(cat) {
  const map = { tops: '👕', bottoms: '👖', outerwear: '🧥', footwear: '👟', accessories: '⌚', ethnic: '🥻' };
  return map[cat] || '👗';
}

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
