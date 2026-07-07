/* ==========================================
   OUTFIT.JS — Outfit Suggester
   ========================================== */

let currentUser     = null;
let currentOccasion = 'casual';
let currentCity     = '';
let currentOutfit   = null;
let swapSlotRole    = null;

window.addEventListener('cloud-ready', () => {
  currentUser = requireAuth();
  if (!currentUser) return;
  initPageAvatar(currentUser);

  currentCity = currentUser.city || 'Mumbai';
  document.getElementById('outfit-city-label').textContent = currentCity;
  populateCitySelect('city-picker-select', currentCity);

  renderSavedOutfits();
  refreshTryOnSection(null);
  loadOutfitWeather();
});

function selectOccasion(occ, btn) {
  currentOccasion = occ;
  document.querySelectorAll('.occ-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── Generate ──────────────────────────────────────────────────────────────────

function generateOutfit() {
  const wardrobe = _getWardrobe();
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

  const shareBtn = document.getElementById('share-outfit-btn');
  if (shareBtn) shareBtn.classList.remove('hidden');

  // Avatar try-on
  refreshTryOnSection(result.slots);

  // Slots
  const slotsEl = document.getElementById('outfit-slots');
  slotsEl.innerHTML = '';
  result.slots.forEach(slot => {
    const el = document.createElement('div');
    el.className = 'outfit-slot';
    const imgHtml = slot.item.imageData
      ? `<div class="slot-img"><img src="${slot.item.imageData}" /></div>`
      : `<div class="slot-img">${_emoji(slot.item.category)}</div>`;
    el.innerHTML = `
      ${imgHtml}
      <div class="slot-info">
        <div class="slot-category">${slot.label}</div>
        <div class="slot-name">${slot.item.subtype}</div>
        <div class="slot-color">${_cap(slot.item.color)} · ${slot.item.pattern}</div>
      </div>
      <button class="slot-swap-btn" onclick="openSwapModal('${slot.role}')">Swap</button>`;
    slotsEl.appendChild(el);
  });

  // Tips
  document.getElementById('styling-tips-list').innerHTML =
    result.tips.map(t => `<li>${t}</li>`).join('');

  // Palette
  const sw = document.getElementById('palette-swatches');
  sw.innerHTML = '';
  result.palette.hexes.forEach(hex => {
    const d = document.createElement('div');
    d.className = 'palette-swatch';
    d.style.backgroundColor = hex;
    sw.appendChild(d);
  });
  document.getElementById('palette-desc').textContent = result.palette.desc;

  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Avatar try-on ─────────────────────────────────────────────────────────────

async function refreshTryOnSection(slots) {
  const stage  = document.getElementById('outfit-avatar-stage');
  const pieces = document.getElementById('tryon-pieces-col');
  if (!stage) return;

  await renderAvatarWithOutfit(stage, currentUser, slots || []);

  if (pieces) {
    pieces.innerHTML = '';
    if (slots && slots.length > 0) {
      slots.forEach(slot => {
        const row = document.createElement('div');
        row.className = 'tryon-piece-row';
        const img = slot.item.imageData
          ? `<img src="${slot.item.imageData}" class="tryon-piece-thumb" />`
          : `<div class="tryon-piece-emoji">${_emoji(slot.item.category)}</div>`;
        row.innerHTML = `${img}
          <div class="tryon-piece-details">
            <div class="tryon-piece-cat">${slot.label}</div>
            <div class="tryon-piece-name">${_cap(slot.item.color)} ${slot.item.subtype}</div>
          </div>`;
        pieces.appendChild(row);
      });
    } else {
      pieces.innerHTML = `<p style="font-size:0.8rem;color:var(--text-muted);padding:0.5rem">
        Generate an outfit to dress your avatar</p>`;
    }
  }
}

// ── Save outfits ──────────────────────────────────────────────────────────────

function saveCurrentOutfit() {
  if (!currentOutfit) return;
  const key = 'styleai_saved_outfits_' + currentUser.username;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}

  const entry = {
    id:       String(Date.now()),
    name:     currentOutfit.outfitName,
    occasion: currentOccasion,
    slots:    currentOutfit.slots.map(s => ({ role:s.role, label:s.label, item:s.item })),
    savedAt:  Date.now()
  };
  saved.unshift(entry);
  if (saved.length > 20) saved = saved.slice(0, 20);
  try { localStorage.setItem(key, JSON.stringify(saved)); } catch {}
  window.cloudSync?.pushSavedOutfits(currentUser?.username, saved);

  document.getElementById('save-outfit-btn').textContent = '✓ Saved!';
  showToast('Look saved ✦');
  renderSavedOutfits();
}

function renderSavedOutfits() {
  const key   = 'styleai_saved_outfits_' + currentUser?.username;
  let saved   = [];
  try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  const sec   = document.getElementById('saved-section');
  const list  = document.getElementById('saved-outfits-list');
  if (!sec || !list) return;
  if (saved.length === 0) { sec.classList.add('hidden'); return; }
  sec.classList.remove('hidden');

  list.innerHTML = saved.map(e => {
    const thumbs = e.slots.slice(0,3).map(s =>
      s.item?.imageData
        ? `<img src="${s.item.imageData}" class="saved-thumb" />`
        : `<div class="saved-thumb-emoji">${_emoji(s.item?.category)}</div>`
    ).join('');
    return `<div class="saved-outfit-card">
      <div class="saved-thumbs">${thumbs}</div>
      <div class="saved-info">
        <div class="saved-name">${e.name}</div>
        <div class="saved-occ">${_cap(e.occasion)} · ${new Date(e.savedAt).toLocaleDateString()}</div>
      </div>
      <button class="saved-delete" onclick="deleteSavedOutfit('${e.id}')">✕</button>
    </div>`;
  }).join('');
}

function deleteSavedOutfit(id) {
  const key = 'styleai_saved_outfits_' + currentUser.username;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  saved = saved.filter(s => s.id !== id);
  try { localStorage.setItem(key, JSON.stringify(saved)); } catch {}
  window.cloudSync?.pushSavedOutfits(currentUser?.username, saved);
  renderSavedOutfits();
}

function clearSavedOutfits() {
  if (!confirm('Clear all saved looks?')) return;
  localStorage.removeItem('styleai_saved_outfits_' + currentUser.username);
  window.cloudSync?.pushSavedOutfits(currentUser?.username, []);
  renderSavedOutfits();
}

// ── Swap ──────────────────────────────────────────────────────────────────────

function openSwapModal(role) {
  swapSlotRole  = role;
  const cats    = { top:['tops','ethnic'], bottom:['bottoms','ethnic'], outerwear:['outerwear'], footwear:['footwear'], accessory:['accessories'] };
  const options = _getWardrobe().filter(i => (cats[role]||['tops']).includes(i.category));

  document.getElementById('swap-modal-title').textContent = 'Swap ' + _cap(role);
  const grid = document.getElementById('swap-grid');
  grid.innerHTML = '';

  if (!options.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);padding:1rem;grid-column:1/-1">No items in this category</p>';
  } else {
    options.forEach(item => {
      const el = document.createElement('div');
      el.className = 'swap-item';
      if (currentOutfit?.slots.find(s => s.role===role)?.item.id === item.id) el.classList.add('selected');
      el.onclick = () => swapItem(item);
      el.innerHTML = item.imageData
        ? `<img src="${item.imageData}" />`
        : `<span style="font-size:1.8rem">${_emoji(item.category)}</span>`;
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
  if (slot) { slot.item = newItem; currentOutfit.palette = buildPalette(currentOutfit.slots); }
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
  loadOutfitWeather();
  showToast('City set to ' + currentCity);
}

// ── Weather ───────────────────────────────────────────────────────────────────

async function loadOutfitWeather() {
  const el = document.getElementById('outfit-weather-bar');
  if (!el) return;
  try {
    const w = await fetchWeather(currentCity);
    const cat = getTempCategory(w.temp);
    el.innerHTML = `<div class="outfit-weather-inner">
      <span class="outfit-weather-temp">${w.temp}${w.unit} ${w.description.split(' ').pop()}</span>
      <span class="outfit-weather-advice">${w.advice[0]}</span>
    </div>`;
    el.className = 'outfit-weather-bar weather-' + cat;
    el.classList.remove('hidden');
  } catch {}
}

// ── Share ─────────────────────────────────────────────────────────────────────

function shareCurrentOutfit() {
  if (!currentOutfit || !currentUser) return;
  showShareCard(currentOutfit, currentUser.username);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _emoji(cat) {
  return {tops:'👕',bottoms:'👖',outerwear:'🧥',footwear:'👟',accessories:'⌚',ethnic:'🥻'}[cat]||'👗';
}
function _cap(s) { return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }
function _getWardrobe() {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_'+currentUser.username))||[]; }
  catch { return []; }
}
