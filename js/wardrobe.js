/* ==========================================
   WARDROBE.JS — Wardrobe Management
   ========================================== */

let currentUser     = null;
let wardrobeItems   = [];
let selectedColor   = '';
let currentFilter   = 'all';
let currentItemId   = null;
let pendingImageB64 = null;   // ← fix: separate variable holds base64, not preview.src

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
    console.warn('loadWardrobe error:', e);
    return [];
  }
}

function saveWardrobe() {
  try {
    localStorage.setItem(
      'styleai_wardrobe_' + currentUser.username,
      JSON.stringify(wardrobeItems)
    );
  } catch (e) {
    // localStorage quota exceeded (too many large photos)
    showToast('Storage full — try removing some items or use smaller photos', 'error');
    console.warn('saveWardrobe quota error:', e);
  }
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

function openUploadModal() {
  pendingImageB64 = null;
  document.getElementById('upload-modal').classList.remove('hidden');
  document.getElementById('photo-preview').classList.add('hidden');
  document.getElementById('photo-preview').src = '';
  document.getElementById('photo-placeholder').style.display = 'flex';
  document.getElementById('autodetect-banner').classList.add('hidden');
  document.getElementById('detected-color-badge').classList.add('hidden');
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

// ── Photo picker integration ──────────────────────────────────────────────────

function openWardrobePhotoPicker() {
  openPhotoPicker((dataUrl) => {
    if (!dataUrl) return;
    pendingImageB64 = dataUrl;          // ← store separately

    const preview     = document.getElementById('photo-preview');
    const placeholder = document.getElementById('photo-placeholder');
    preview.src = dataUrl;
    preview.classList.remove('hidden');
    placeholder.style.display = 'none';

    runAutoDetect(dataUrl);
  }, {
    title: 'Add Clothing Photo',
    hint:  'Take a photo or pick from gallery/files. Color is auto-detected.'
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
    document.getElementById('autodetect-text').textContent =
      'Could not auto-detect — please choose color below';
  }
}

function applyDetectedColor(colorName, hex) {
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
  if (!matched) {
    document.getElementById('upload-color-custom').value = colorName;
    selectedColor = colorName; // still set it so save works
  }
}

function renderColorPicker() {
  const row = document.getElementById('color-picker-row');
  if (!row) return;
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className        = 'color-swatch';
    sw.style.backgroundColor = c.hex;
    sw.dataset.name     = c.name;
    sw.title            = c.name;
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
    showToast('Please select or type a color before saving', 'error');
    return;
  }

  const item = {
    id:        Date.now().toString(),
    category,
    subtype,
    color,
    pattern,
    fit,
    imageData: pendingImageB64 || null,   // ← use dedicated variable
    addedAt:   Date.now()
  };

  wardrobeItems.push(item);
  saveWardrobe();

  // Verify save worked
  const saved = loadWardrobe();
  if (saved.find(i => i.id === item.id)) {
    closeUploadModal();
    renderWardrobe();
    showToast(`${subtype} saved to wardrobe ✦`);
  } else {
    showToast('Save failed — storage may be full', 'error');
    wardrobeItems.pop(); // rollback
  }
}

// ── Item detail modal ─────────────────────────────────────────────────────────

function openItemModal(id) {
  const item = wardrobeItems.find(i => i.id === id);
  if (!item) return;
  currentItemId = id;

  const imgEl = document.getElementById('item-modal-img');
  const noImg = document.getElementById('item-modal-no-img');

  if (item.imageData) {
    imgEl.src   = item.imageData;
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

// ── Shared helper ─────────────────────────────────────────────────────────────

function getActivePillVal(groupId) {
  const el = document.getElementById(groupId);
  if (!el) return null;
  return el.querySelector('.pill.active')?.dataset.val || null;
}
