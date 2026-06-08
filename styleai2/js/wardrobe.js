/* ==========================================
   WARDROBE.JS — Wardrobe Management
   ========================================== */

let currentUser     = null;
let wardrobeItems   = [];
let selectedColor   = '';
let currentFilter   = 'all';
let currentItemId   = null;
let pendingImageB64 = null; // holds base64 photo separately from <img> element

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;
  wardrobeItems = loadWardrobe();
  renderColorPicker();
  renderWardrobe();
  onCategoryChange();
});

// ── Storage ───────────────────────────────────────────────────────────────────

function loadWardrobe() {
  try {
    const raw = localStorage.getItem('styleai_wardrobe_' + currentUser.username);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('loadWardrobe:', e);
    return [];
  }
}

function saveWardrobe() {
  try {
    localStorage.setItem(
      'styleai_wardrobe_' + currentUser.username,
      JSON.stringify(wardrobeItems)
    );
    return true;
  } catch (e) {
    showToast('Storage full — try removing old items or use smaller photos', 'error');
    console.warn('saveWardrobe quota error:', e);
    return false;
  }
}

// ── Grid ──────────────────────────────────────────────────────────────────────

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
      el.innerHTML = `<img src="${item.imageData}" alt="${item.subtype}" loading="lazy" />
        <div class="wardrobe-item-badge">${item.subtype}</div>`;
    } else {
      el.innerHTML = `<div class="wardrobe-item-placeholder">
        <span>${getCategoryEmoji(item.category)}</span>
        <span class="wi-label">${item.color}<br/>${item.subtype}</span>
      </div>`;
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

function openUploadModal() {
  pendingImageB64 = null;

  const modal = document.getElementById('upload-modal');
  const preview = document.getElementById('photo-preview');
  const placeholder = document.getElementById('photo-placeholder');
  const banner = document.getElementById('autodetect-banner');
  const badge  = document.getElementById('detected-color-badge');

  modal.classList.remove('hidden');
  preview.classList.add('hidden');
  preview.src = '';
  placeholder.style.display = 'flex';
  if (banner) banner.classList.add('hidden');
  if (badge)  badge.classList.add('hidden');

  selectedColor = '';
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  document.getElementById('upload-color-custom').value = '';
  resetPillGroup('pattern-group', 'solid');
  resetPillGroup('fit-group', 'regular');
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.add('hidden');
  pendingImageB64 = null;
}

function resetPillGroup(groupId, defaultVal) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.val === defaultVal);
  });
}

// ── Photo picker ──────────────────────────────────────────────────────────────

function openWardrobePhotoPicker() {
  openPhotoPicker((dataUrl) => {
    if (!dataUrl) return;
    pendingImageB64 = dataUrl; // store separately — this is what gets saved

    // Show preview
    const preview     = document.getElementById('photo-preview');
    const placeholder = document.getElementById('photo-placeholder');
    preview.src = dataUrl;
    preview.classList.remove('hidden');
    placeholder.style.display = 'none';

    // Kick off auto-detect
    runAutoDetect(dataUrl);
  }, {
    title: 'Clothing Photo',
    hint:  'Take a photo or choose from gallery / files. Color is detected automatically.'
  });
}

// ── Auto-detect ───────────────────────────────────────────────────────────────

async function runAutoDetect(dataUrl) {
  const banner   = document.getElementById('autodetect-banner');
  const spinner  = document.getElementById('autodetect-spinner');
  const resultEl = document.getElementById('autodetect-result');
  if (!banner) return;

  // Show spinner
  banner.classList.remove('hidden');
  if (spinner)  { spinner.style.display = 'inline'; }
  if (resultEl) { resultEl.classList.add('hidden'); }

  // Run detection
  let detected;
  try {
    const category = document.getElementById('upload-category')?.value || 'tops';
    detected = await analyzeClothingImage(dataUrl, category);
  } catch (e) {
    console.warn('autodetect error:', e);
    detected = { color: '', detectedHex: '', confidence: 0 };
  }

  // Hide spinner, show result
  if (spinner)  { spinner.style.display = 'none'; }
  if (resultEl) { resultEl.classList.remove('hidden'); }

  const textEl   = document.getElementById('autodetect-text');
  const swatchEl = document.getElementById('autodetect-color-swatch');
  const badge    = document.getElementById('detected-color-badge');

  const gotColor = detected && detected.color && detected.color !== '' && detected.color !== 'unknown';

  if (gotColor) {
    applyDetectedColor(detected.color, detected.detectedHex);

    if (textEl)   textEl.textContent =
      'Detected: ' + detected.color +
      (detected.confidence > 0 ? ' (' + detected.confidence + '% match)' : '');
    if (swatchEl && detected.detectedHex) swatchEl.style.background = detected.detectedHex;
    if (badge) {
      badge.textContent = '✦ Auto-detected: ' + detected.color;
      badge.classList.remove('hidden');
    }
  } else {
    if (textEl) textEl.textContent = 'Could not detect color — please choose below';
    if (badge)  badge.classList.add('hidden');
  }
}

function applyDetectedColor(colorName, hex) {
  // Try to match a named swatch
  let matched = false;
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.classList.remove('selected');
    if (sw.dataset.name === colorName) {
      sw.classList.add('selected');
      selectedColor = colorName;
      matched = true;
    }
  });
  if (!matched) {
    // No exact swatch match — put in the text field
    const customEl = document.getElementById('upload-color-custom');
    if (customEl) customEl.value = colorName;
    selectedColor = colorName; // still set so save works
  }
}

// ── Color picker ──────────────────────────────────────────────────────────────

function renderColorPicker() {
  const row = document.getElementById('color-picker-row');
  if (!row) return;
  row.innerHTML = '';
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
  const cat    = document.getElementById('upload-category')?.value;
  const subSel = document.getElementById('upload-subtype');
  if (!cat || !subSel) return;
  const subtypes = SUBTYPES_BY_CATEGORY[cat] || [];
  subSel.innerHTML = subtypes.map(s => `<option value="${s}">${s}</option>`).join('');
}

// ── Save item ─────────────────────────────────────────────────────────────────

function saveClothingItem() {
  const category    = document.getElementById('upload-category').value;
  const subtype     = document.getElementById('upload-subtype').value;
  const customColor = document.getElementById('upload-color-custom').value.trim();
  const color       = customColor || selectedColor;
  const pattern     = getActivePillVal('pattern-group') || 'solid';
  const fit         = getActivePillVal('fit-group')     || 'regular';

  if (!color) {
    showToast('Please pick or type a color first', 'error');
    return;
  }

  const item = {
    id:        Date.now().toString(),
    category,  subtype, color, pattern, fit,
    imageData: pendingImageB64 || null,  // use dedicated variable — never preview.src
    addedAt:   Date.now()
  };

  wardrobeItems.push(item);
  const ok = saveWardrobe();

  if (ok) {
    closeUploadModal();
    renderWardrobe();
    showToast(subtype + ' saved to wardrobe ✦');
  } else {
    wardrobeItems.pop(); // rollback on save failure
  }
}

// ── Item modal ────────────────────────────────────────────────────────────────

function openItemModal(id) {
  const item = wardrobeItems.find(i => i.id === id);
  if (!item) return;
  currentItemId = id;

  const imgEl = document.getElementById('item-modal-img');
  const noImg = document.getElementById('item-modal-no-img');

  if (item.imageData) {
    imgEl.src   = item.imageData;
    imgEl.style.display = 'block';
    if (noImg) noImg.classList.add('hidden');
  } else {
    imgEl.style.display = 'none';
    if (noImg) {
      noImg.classList.remove('hidden');
      noImg.innerHTML = '<div style="font-size:4rem;text-align:center;padding:2rem">'
        + getCategoryEmoji(item.category) + '</div>';
    }
  }

  document.getElementById('item-modal-title').textContent = item.color + ' ' + item.subtype;
  document.getElementById('item-modal-meta').textContent  =
    item.category + ' · ' + item.pattern + ' · ' + item.fit + ' fit';
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

// ── Helper ────────────────────────────────────────────────────────────────────

function getActivePillVal(groupId) {
  return document.getElementById(groupId)?.querySelector('.pill.active')?.dataset.val || null;
}
