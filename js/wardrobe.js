/* ==========================================
   WARDROBE.JS — Wardrobe Management
   ========================================== */

let currentUser   = null;
let wardrobeItems = [];
let selectedColor = '';
let currentFilter = 'all';
let currentItemId = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;
  wardrobeItems = loadWardrobe();
  renderColorPicker();
  renderWardrobe();
  onCategoryChange(); // init subtype dropdown
});

// ── Storage ───────────────────────────────────────────────────────────────────

function loadWardrobe() {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + currentUser.username)) || []; }
  catch { return []; }
}

function saveWardrobe() {
  localStorage.setItem('styleai_wardrobe_' + currentUser.username, JSON.stringify(wardrobeItems));
}

// ── Render grid ───────────────────────────────────────────────────────────────

function renderWardrobe() {
  const grid  = document.getElementById('wardrobe-grid');
  const empty = document.getElementById('empty-state');

  const filtered = currentFilter === 'all'
    ? wardrobeItems
    : wardrobeItems.filter(i => i.category === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) { empty.style.display = 'flex'; grid.appendChild(empty); }
    return;
  }

  if (empty) empty.style.display = 'none';
  grid.innerHTML = '';

  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'wardrobe-item';
    el.onclick = () => openItemModal(item.id);

    if (item.imageData) {
      el.innerHTML = `
        <img src="${item.imageData}" alt="${item.subtype}" loading="lazy" />
        <div class="wardrobe-item-badge">${item.subtype}</div>
      `;
    } else {
      el.innerHTML = `
        <div class="wardrobe-item-placeholder">
          <span>${getCategoryEmoji(item.category)}</span>
          <span class="wi-label">${item.color}<br/>${item.subtype}</span>
        </div>
      `;
    }
    grid.appendChild(el);
  });
}

function filterCategory(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderWardrobe();
}

function getCategoryEmoji(cat) {
  return { tops:'👕', bottoms:'👖', outerwear:'🧥', footwear:'👟', accessories:'⌚', ethnic:'🥻' }[cat] || '👗';
}

// ── Upload modal ──────────────────────────────────────────────────────────────

function openWardrobePhotoPicker() {
  openPhotoPicker((dataUrl) => {
    // Show preview
    const preview     = document.getElementById('photo-preview');
    const placeholder = document.getElementById('photo-placeholder');
    preview.src = dataUrl;
    preview.classList.remove('hidden');
    placeholder.style.display = 'none';
    // Trigger auto-detect
    runAutoDetect(dataUrl);
  }, {
    title: 'Add Clothing Photo',
    hint:  'Take or upload a photo of the clothing item. Color & type are auto-detected.'
  });
}

async function runAutoDetect(dataUrl) {
  const banner  = document.getElementById('autodetect-banner');
  const spinner = document.getElementById('autodetect-spinner');
  const result  = document.getElementById('autodetect-result');

  banner.classList.remove('hidden');
  spinner.style.display = 'block';
  result.classList.add('hidden');

  const category = document.getElementById('upload-category').value;
  const detected = await analyzeClothingImage(dataUrl, category);

  spinner.style.display = 'none';
  result.classList.remove('hidden');

  if (detected.color && detected.color !== 'unknown') {
    applyDetectedColor(detected.color, detected.detectedHex);
    const badge = document.getElementById('detected-color-badge');
    badge.textContent = `✦ Auto-detected: ${detected.color}`;
    badge.classList.remove('hidden');
    document.getElementById('autodetect-text').textContent = `Detected: ${detected.color}`;
    const swatch = document.getElementById('autodetect-color-swatch');
    swatch.style.background = detected.detectedHex || '#888';
  } else {
    document.getElementById('autodetect-text').textContent = 'Could not detect — please select color below';
  }
}

function openUploadModal() {
  document.getElementById('upload-modal').classList.remove('hidden');
  document.getElementById('photo-preview').classList.add('hidden');
  document.getElementById('photo-placeholder').style.display = 'flex';
  document.getElementById('upload-file-input').value = '';
  document.getElementById('autodetect-banner').classList.add('hidden');
  document.getElementById('detected-color-badge').classList.add('hidden');
  selectedColor = '';
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  document.getElementById('upload-color-custom').value = '';
  // Reset pattern/fit
  document.querySelector('#pattern-group .pill[data-val="solid"]').classList.add('active');
  document.querySelectorAll('#pattern-group .pill:not([data-val="solid"])').forEach(p => p.classList.remove('active'));
  document.querySelector('#fit-group .pill[data-val="regular"]').classList.add('active');
  document.querySelectorAll('#fit-group .pill:not([data-val="regular"])').forEach(p => p.classList.remove('active'));
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.add('hidden');
}

// handlePhotoUpload replaced by openWardrobePhotoPicker + runAutoDetect above

function applyDetectedColor(colorName, hex) {
  // Try to select matching named swatch
  const swatches = document.querySelectorAll('.color-swatch');
  let matched = false;
  swatches.forEach(sw => {
    sw.classList.remove('selected');
    if (sw.dataset.name === colorName) {
      sw.classList.add('selected');
      selectedColor = colorName;
      matched = true;
    }
  });
  // If no exact match, put in custom field
  if (!matched) {
    document.getElementById('upload-color-custom').value = colorName;
    selectedColor = '';
  }
}

function renderColorPicker() {
  const row = document.getElementById('color-picker-row');
  if (!row) return;
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch';
    sw.style.backgroundColor = c.hex;
    sw.dataset.name = c.name;
    sw.title = c.name;
    sw.onclick = () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      selectedColor = c.name;
      document.getElementById('upload-color-custom').value = '';
    };
    row.appendChild(sw);
  });
}

function onCategoryChange() {
  const cat = document.getElementById('upload-category')?.value;
  const subSel = document.getElementById('upload-subtype');
  if (!cat || !subSel) return;
  const subtypes = SUBTYPES_BY_CATEGORY[cat] || [];
  subSel.innerHTML = subtypes.map(s => `<option value="${s}">${s}</option>`).join('');
}

function saveClothingItem() {
  const category    = document.getElementById('upload-category').value;
  const subtype     = document.getElementById('upload-subtype').value;
  const customColor = document.getElementById('upload-color-custom').value.trim();
  const color       = customColor || selectedColor;
  const pattern     = getActivePillVal('pattern-group') || 'solid';
  const fit         = getActivePillVal('fit-group')     || 'regular';
  const preview     = document.getElementById('photo-preview');
  const imageData   = preview && !preview.classList.contains('hidden') ? preview.src : null;

  if (!color) { showToast('Please select or type a color', 'error'); return; }

  wardrobeItems.push({
    id: Date.now().toString(),
    category, subtype, color, pattern, fit,
    imageData,
    addedAt: Date.now()
  });

  saveWardrobe();
  closeUploadModal();
  renderWardrobe();
  showToast(`${subtype} added ✦`);
}

// ── Item detail modal ─────────────────────────────────────────────────────────

function openItemModal(id) {
  const item = wardrobeItems.find(i => i.id === id);
  if (!item) return;
  currentItemId = id;

  const imgEl = document.getElementById('item-modal-img');
  const noImg = document.getElementById('item-modal-no-img');

  if (item.imageData) {
    imgEl.src = item.imageData;
    imgEl.style.display = 'block';
    noImg.classList.add('hidden');
  } else {
    imgEl.style.display = 'none';
    noImg.classList.remove('hidden');
    noImg.innerHTML = `<div style="font-size:4rem;text-align:center;padding:2rem">${getCategoryEmoji(item.category)}</div>`;
  }

  document.getElementById('item-modal-title').textContent = `${item.color} ${item.subtype}`;
  document.getElementById('item-modal-meta').textContent  =
    `${item.category} · ${item.pattern} · ${item.fit} fit`;
  document.getElementById('item-modal').classList.remove('hidden');
}

function closeItemModal() {
  document.getElementById('item-modal').classList.add('hidden');
  currentItemId = null;
}

function deleteCurrentItem() {
  if (!currentItemId) return;
  if (!confirm('Remove this item from your wardrobe?')) return;
  wardrobeItems = wardrobeItems.filter(i => i.id !== currentItemId);
  saveWardrobe();
  closeItemModal();
  renderWardrobe();
  showToast('Item removed');
}

// Helper re-exposed for auth.js compatibility
function getActivePillVal(groupId) {
  const el = document.getElementById(groupId);
  if (!el) return null;
  const a = el.querySelector('.pill.active');
  return a ? a.dataset.val : null;
}
