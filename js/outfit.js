/* ==========================================
   OUTFIT.JS — Outfit Suggester Page
   ========================================== */

let currentUser    = null;
let currentOccasion = 'casual';
let currentCity    = '';
let currentOutfit  = null;
let swapSlotRole   = null;
let pendingBodyPhotoData = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;
  initAvatar(currentUser);

  currentCity = currentUser.city || 'Mumbai';
  document.getElementById('outfit-city-label').textContent = currentCity;
  populateCitySelect('city-picker-select', currentCity);
  loadOutfitWeather();

  // Load and show saved outfits
  renderSavedOutfits();

  // If user already has body photo, show try-on prompt
  refreshTryOnSection(null);
});

function selectOccasion(occ, btn) {
  currentOccasion = occ;
  document.querySelectorAll('.occ-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── Generate ──────────────────────────────────────────────────────────────────

function generateOutfit() {
  const wardrobe = getWardrobe(currentUser.username);

  if (wardrobe.length < 2) {
    document.getElementById('no-wardrobe-warning').classList.remove('hidden');
    document.getElementById('outfit-result').classList.add('hidden');
    return;
  }

  document.getElementById('no-wardrobe-warning').classList.add('hidden');

  const result = generateOutfitSuggestion(wardrobe, currentUser, currentOccasion, currentCity);
  if (!result) { showToast('Not enough variety for this occasion. Add more clothes!', 'error'); return; }

  currentOutfit = result;
  renderOutfitResult(result);
}

function renderOutfitResult(result) {
  const resultEl = document.getElementById('outfit-result');
  resultEl.classList.remove('hidden');

  document.getElementById('outfit-name').textContent = result.outfitName;
  document.getElementById('outfit-desc').textContent = result.outfitDesc;
  document.getElementById('save-outfit-btn').textContent = '🔖 Save Look';
  // Show share btn
  const shareBtn = document.getElementById('share-outfit-btn');
  if (shareBtn) shareBtn.classList.remove('hidden');

  // Try-on
  refreshTryOnSection(result.slots);

  // Slots
  const slotsEl = document.getElementById('outfit-slots');
  slotsEl.innerHTML = '';
  result.slots.forEach(slot => {
    const el = document.createElement('div');
    el.className = 'outfit-slot';

    const imgHtml = slot.item.imageData
      ? `<div class="slot-img"><img src="${slot.item.imageData}" /></div>`
      : `<div class="slot-img">${getCategoryEmoji(slot.item.category)}</div>`;

    el.innerHTML = `
      ${imgHtml}
      <div class="slot-info">
        <div class="slot-category">${slot.label}</div>
        <div class="slot-name">${slot.item.subtype}</div>
        <div class="slot-color">${cap(slot.item.color)} · ${slot.item.pattern}</div>
      </div>
      <button class="slot-swap-btn"
        onclick="event.stopPropagation(); openSwapModal('${slot.role}')">Swap</button>
    `;
    slotsEl.appendChild(el);
  });

  // Tips
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

  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Avatar Try-On ──────────────────────────────────────────────────────────────

async function refreshTryOnSection(slots) {
  const stage  = document.getElementById('outfit-avatar-stage');
  const pieces = document.getElementById('tryon-pieces-col');
  if (!stage) return;

  // Render animated avatar with outfit
  await renderAvatarWithOutfit(stage, currentUser, slots);

  // Render piece list on the right
  if (pieces && slots) {
    pieces.innerHTML = '';
    slots.forEach(slot => {
      const row = document.createElement('div');
      row.className = 'tryon-piece-row';
      const imgEl = slot.item.imageData
        ? `<img src="${slot.item.imageData}" class="tryon-piece-thumb" />`
        : `<div class="tryon-piece-emoji">${_catEmoji(slot.item.category)}</div>`;
      row.innerHTML = `
        ${imgEl}
        <div class="tryon-piece-details">
          <div class="tryon-piece-cat">${slot.label}</div>
          <div class="tryon-piece-name">${cap(slot.item.color)} ${slot.item.subtype}</div>
        </div>`;
      pieces.appendChild(row);
    });
  }
}

function goToProfile() {
  window.location.href = 'profile.html';
}

function openBodyPhotoUpload() {
  // Shows the modal with current photo; user can re-upload via picker inside modal
  pendingBodyPhotoData = getUserBodyPhoto() || null;
  const preview     = document.getElementById('body-photo-preview-modal');
  const placeholder = document.getElementById('body-photo-placeholder-modal');
  if (pendingBodyPhotoData) {
    preview.src = pendingBodyPhotoData;
    preview.classList.remove('hidden');
    placeholder.style.display = 'none';
    document.getElementById('save-body-photo-btn').disabled = false;
  } else {
    preview.classList.add('hidden');
    placeholder.style.display = 'flex';
    document.getElementById('save-body-photo-btn').disabled = true;
  }
  document.getElementById('body-photo-modal').classList.remove('hidden');
}

// Called when user taps the photo area inside the body photo modal
function openBodyPhotoPickerSheet() {
  openPhotoPicker(function(dataUrl) {
    pendingBodyPhotoData = dataUrl;
    const preview = document.getElementById('body-photo-preview-modal');
    preview.src   = dataUrl;
    preview.classList.remove('hidden');
    document.getElementById('body-photo-placeholder-modal').style.display = 'none';
    document.getElementById('save-body-photo-btn').disabled = false;
  }, {
    title: 'Your Full-Body Photo',
    hint:  'Stand straight against a plain background. Full length from head to toe works best.'
  });
}

function closeBodyPhotoModal() {
  document.getElementById('body-photo-modal').classList.add('hidden');
}

function saveBodyPhoto() {
  if (!pendingBodyPhotoData) return;
  const updated = updateCurrentUser({ bodyPhoto: pendingBodyPhotoData });
  // Update local reference
  if (currentUser) currentUser.bodyPhoto = pendingBodyPhotoData;
  closeBodyPhotoModal();
  showToast('Photo saved ✦');
  // Refresh try-on
  if (currentOutfit) refreshTryOnSection(currentOutfit.slots);
  else refreshTryOnSection(null);
}

// ── Save Outfits ──────────────────────────────────────────────────────────────

function saveCurrentOutfit() {
  if (!currentOutfit) return;
  const key = 'styleai_saved_outfits_' + currentUser.username;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}

  const entry = {
    id:        Date.now().toString(),
    name:      currentOutfit.outfitName,
    occasion:  currentOccasion,
    slots:     currentOutfit.slots.map(s => ({ role: s.role, label: s.label, item: s.item })),
    savedAt:   Date.now()
  };

  saved.unshift(entry);
  if (saved.length > 20) saved = saved.slice(0, 20);
  localStorage.setItem(key, JSON.stringify(saved));

  document.getElementById('save-outfit-btn').textContent = '✓ Saved!';
  showToast('Look saved to your collection ✦');
  renderSavedOutfits();
}

function renderSavedOutfits() {
  const key = 'styleai_saved_outfits_' + currentUser?.username;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}

  const section = document.getElementById('saved-section');
  const list    = document.getElementById('saved-outfits-list');

  if (saved.length === 0) { section.classList.add('hidden'); return; }
  section.classList.remove('hidden');

  list.innerHTML = '';
  saved.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'saved-outfit-card';

    const thumbs = entry.slots.slice(0, 3).map(s =>
      s.item.imageData
        ? `<img src="${s.item.imageData}" class="saved-thumb" />`
        : `<div class="saved-thumb-emoji">${getCategoryEmoji(s.item.category)}</div>`
    ).join('');

    card.innerHTML = `
      <div class="saved-thumbs">${thumbs}</div>
      <div class="saved-info">
        <div class="saved-name">${entry.name}</div>
        <div class="saved-occ">${cap(entry.occasion)} · ${new Date(entry.savedAt).toLocaleDateString()}</div>
      </div>
      <button class="saved-delete" onclick="deleteSavedOutfit('${entry.id}')">✕</button>
    `;
    list.appendChild(card);
  });
}

function deleteSavedOutfit(id) {
  const key = 'styleai_saved_outfits_' + currentUser.username;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  saved = saved.filter(s => s.id !== id);
  localStorage.setItem(key, JSON.stringify(saved));
  renderSavedOutfits();
}

function clearSavedOutfits() {
  if (!confirm('Clear all saved looks?')) return;
  localStorage.removeItem('styleai_saved_outfits_' + currentUser.username);
  renderSavedOutfits();
}

// ── Swap ──────────────────────────────────────────────────────────────────────

function openSwapModal(role) {
  swapSlotRole = role;
  const roleCatMap = {
    top:       ['tops','ethnic'],
    bottom:    ['bottoms','ethnic'],
    outerwear: ['outerwear'],
    footwear:  ['footwear'],
    accessory: ['accessories']
  };

  const allowed  = roleCatMap[role] || ['tops'];
  const wardrobe = getWardrobe(currentUser.username);
  const options  = wardrobe.filter(i => allowed.includes(i.category));

  document.getElementById('swap-modal-title').textContent = `Swap ${cap(role)}`;
  const grid = document.getElementById('swap-grid');
  grid.innerHTML = '';

  if (options.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);padding:1rem;grid-column:1/-1">No items in this category</p>';
  } else {
    options.forEach(item => {
      const el  = document.createElement('div');
      el.className = 'swap-item';
      el.onclick   = () => swapItem(item);

      const cur = currentOutfit?.slots.find(s => s.role === role);
      if (cur?.item.id === item.id) el.classList.add('selected');

      el.innerHTML = item.imageData
        ? `<img src="${item.imageData}" />`
        : `<span>${getCategoryEmoji(item.category)}</span><small>${item.color}</small>`;
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
    currentOutfit.palette = buildPalette(currentOutfit.slots);
  }
  closeSwapModal();
  renderOutfitResult(currentOutfit);
  showToast('Outfit updated ✦');
}

// ── City ──────────────────────────────────────────────────────────────────────

function showCityPicker() { document.getElementById('city-modal').classList.remove('hidden'); }
function closeCityModal()  { document.getElementById('city-modal').classList.add('hidden'); }

function applyCity() {
  currentCity = document.getElementById('city-picker-select').value;
  document.getElementById('outfit-city-label').textContent = currentCity;
  closeCityModal();
  showToast(`City set to ${currentCity}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryEmoji(cat) {
  return { tops:'👕', bottoms:'👖', outerwear:'🧥', footwear:'👟', accessories:'⌚', ethnic:'🥻' }[cat] || '👗';
}

function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getWardrobe(username) {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + username)) || []; }
  catch { return []; }
}

// ── Share card ────────────────────────────────────────────────────────────────
function shareCurrentOutfit() {
  if (!currentOutfit || !currentUser) return;
  showShareCard(currentOutfit, currentUser.username);
}

// ── Weather advisory in outfit ────────────────────────────────────────────────
async function loadOutfitWeather() {
  const el = document.getElementById('outfit-weather-bar');
  if (!el) return;
  try {
    const w = await fetchWeather(currentCity);
    const cat = getTempCategory(w.temp);
    el.innerHTML = `
      <div class="outfit-weather-inner">
        <span class="outfit-weather-temp">${w.temp}${w.unit} ${w.description.split(' ').pop()}</span>
        <span class="outfit-weather-advice">${w.advice[0]}</span>
      </div>`;
    el.className = 'outfit-weather-bar weather-' + cat;
    el.classList.remove('hidden');
  } catch {}
}
