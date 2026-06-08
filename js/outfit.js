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

  currentCity = currentUser.city || 'Mumbai';
  document.getElementById('outfit-city-label').textContent = currentCity;
  populateCitySelect('city-picker-select', currentCity);

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

// ── Virtual Try-On ────────────────────────────────────────────────────────────

function refreshTryOnSection(slots) {
  const body = document.getElementById('tryon-body');
  const userPhoto = getUserBodyPhoto();

  if (!userPhoto) {
    renderTryOnNoPhoto(body, openBodyPhotoUpload);
    return;
  }

  if (!slots) {
    body.innerHTML = `
      <div class="tryon-no-photo" style="padding:1rem">
        <div style="font-size:1.5rem">✦</div>
        <p style="font-size:0.82rem;color:var(--text-secondary)">Generate an outfit to see virtual try-on</p>
      </div>`;
    return;
  }

  renderTryOn(userPhoto, slots, body);
}

function getUserBodyPhoto() {
  return currentUser?.bodyPhoto || null;
}

function openBodyPhotoUpload() {
  pendingBodyPhotoData = null;
  document.getElementById('save-body-photo-btn').disabled = true;

  // Pre-fill if exists
  const existing = getUserBodyPhoto();
  const preview  = document.getElementById('body-photo-preview-modal');
  const placeholder = document.getElementById('body-photo-placeholder-modal');
  if (existing) {
    preview.src = existing;
    preview.classList.remove('hidden');
    placeholder.style.display = 'none';
    document.getElementById('save-body-photo-btn').disabled = false;
    pendingBodyPhotoData = existing;
  } else {
    preview.classList.add('hidden');
    placeholder.style.display = 'flex';
  }

  document.getElementById('body-photo-modal').classList.remove('hidden');
}

function closeBodyPhotoModal() {
  document.getElementById('body-photo-modal').classList.add('hidden');
}

function handleBodyPhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    pendingBodyPhotoData = dataUrl;
    const preview = document.getElementById('body-photo-preview-modal');
    preview.src = dataUrl;
    preview.classList.remove('hidden');
    document.getElementById('body-photo-placeholder-modal').style.display = 'none';
    document.getElementById('save-body-photo-btn').disabled = false;
  };
  reader.readAsDataURL(file);
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
