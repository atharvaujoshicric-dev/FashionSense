/* ==========================================
   WARDROBE.JS
   ========================================== */

let _wUser      = null;
let _wItems     = [];
let _wFilter    = 'all';
let _wItemId    = null;
let _wPhoto     = null;   // base64 of pending clothing photo
let _wColor     = '';     // selected color name

document.addEventListener('DOMContentLoaded', () => {
  _wUser  = requireAuth();
  if (!_wUser) return;
  initAvatar(_wUser);
  _wItems = _load();
  _buildColorSwatches();
  _render();
  _syncSubtypes();
});

// ── Storage ───────────────────────────────────────────────────────────────────

function _load() {
  try {
    const raw = localStorage.getItem('styleai_wardrobe_' + _wUser.username);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function _save() {
  try {
    localStorage.setItem('styleai_wardrobe_' + _wUser.username, JSON.stringify(_wItems));
    return true;
  } catch (e) {
    showToast('Storage full — try a smaller photo or remove old items', 'error');
    console.warn('wardrobe save failed:', e);
    return false;
  }
}

// ── Grid render ───────────────────────────────────────────────────────────────

function _render() {
  const grid  = document.getElementById('wardrobe-grid');
  const empty = document.getElementById('empty-state');
  const list  = _wFilter === 'all' ? _wItems : _wItems.filter(i => i.category === _wFilter);

  if (list.length === 0) {
    grid.innerHTML = '';
    if (empty) { empty.style.display = 'flex'; grid.appendChild(empty); }
    return;
  }
  if (empty) empty.style.display = 'none';
  grid.innerHTML = '';

  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'wardrobe-item';
    el.onclick   = () => _openDetail(item.id);

    if (item.imageData) {
      el.innerHTML = `
        <img src="${item.imageData}" alt="${item.subtype}" loading="lazy" />
        <div class="wardrobe-item-badge">${item.subtype}</div>`;
    } else {
      const dot = _hexFor(item.color);
      el.innerHTML = `
        <div class="wardrobe-item-placeholder">
          <span>${_catEmoji(item.category)}</span>
          ${dot ? `<span class="wi-color-dot" style="background:${dot}"></span>` : ''}
          <span class="wi-label">${item.color}<br/>${item.subtype}</span>
        </div>`;
    }
    grid.appendChild(el);
  });
}

function filterCategory(cat, btn) {
  _wFilter = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  _render();
}

// ── Upload modal ──────────────────────────────────────────────────────────────

function openUploadModal() {
  _wPhoto = null;
  _wColor = '';

  document.getElementById('upload-modal').classList.remove('hidden');
  _setPhotoState(null);
  document.getElementById('autodetect-banner').classList.add('hidden');
  document.getElementById('detected-color-badge').classList.add('hidden');
  document.getElementById('upload-color-custom').value = '';

  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  _resetPills('pattern-group', 'solid');
  _resetPills('fit-group', 'regular');
  _syncSubtypes();
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.add('hidden');
  _wPhoto = null;
  _wColor = '';
}

function _setPhotoState(dataUrl) {
  const preview     = document.getElementById('photo-preview');
  const placeholder = document.getElementById('photo-placeholder');
  if (dataUrl) {
    preview.src = dataUrl;
    preview.classList.remove('hidden');
    placeholder.style.display = 'none';
  } else {
    preview.src = '';
    preview.classList.add('hidden');
    placeholder.style.display = 'flex';
  }
}

// ── Photo picker ──────────────────────────────────────────────────────────────

function openWardrobePhotoPicker() {
  openPhotoPicker(function(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      showToast('Photo could not be loaded', 'error');
      return;
    }
    _wPhoto = dataUrl;           // store in module-level var
    _setPhotoState(dataUrl);     // show preview
    _runAutoDetect(dataUrl);     // detect color
  }, {
    title: 'Clothing Photo',
    hint:  'Take a photo or pick from gallery. Color is auto-detected from the image.'
  });
}

// ── Auto color detection ──────────────────────────────────────────────────────

async function _runAutoDetect(dataUrl) {
  const banner   = document.getElementById('autodetect-banner');
  const spinner  = document.getElementById('autodetect-spinner');
  const resultEl = document.getElementById('autodetect-result');

  // Show banner + spinner
  banner.classList.remove('hidden');
  spinner.style.display  = 'inline';
  resultEl.style.display = 'none';

  let detected = { color: '', detectedHex: '', confidence: 0 };
  try {
    const cat = document.getElementById('upload-category')?.value || 'tops';
    detected  = await analyzeClothingImage(dataUrl, cat);
  } catch (e) {
    console.warn('autodetect error:', e);
  }

  // Hide spinner, show result
  spinner.style.display  = 'none';
  resultEl.style.display = 'inline';

  const hasColor = detected && detected.color && detected.color !== 'unknown' && detected.color !== '';

  if (hasColor) {
    _applyColor(detected.color, detected.detectedHex);

    const sw = document.getElementById('autodetect-color-swatch');
    const tx = document.getElementById('autodetect-text');
    const bd = document.getElementById('detected-color-badge');

    if (sw) sw.style.background = detected.detectedHex || '#888';
    if (tx) tx.textContent = 'Detected: ' + detected.color +
      (detected.confidence > 0 ? ' (' + detected.confidence + '% confidence)' : '');
    if (bd) { bd.textContent = '✦ ' + detected.color + ' detected'; bd.classList.remove('hidden'); }
  } else {
    const tx = document.getElementById('autodetect-text');
    if (tx) tx.textContent = 'Could not detect — please pick color below';
  }
}

function _applyColor(name, hex) {
  let matched = false;
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.classList.remove('selected');
    if (sw.dataset.name === name) {
      sw.classList.add('selected');
      _wColor = name;
      matched = true;
    }
  });
  if (!matched) {
    const cf = document.getElementById('upload-color-custom');
    if (cf) cf.value = name;
    _wColor = name;
  }
}

// ── Color picker swatches ─────────────────────────────────────────────────────

function _buildColorSwatches() {
  const row = document.getElementById('color-picker-row');
  if (!row) return;
  row.innerHTML = '';
  (typeof COLORS !== 'undefined' ? COLORS : []).forEach(c => {
    const sw = document.createElement('div');
    sw.className             = 'color-swatch';
    sw.style.backgroundColor = c.hex;
    sw.dataset.name          = c.name;
    sw.title                 = c.name;
    sw.onclick = () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      _wColor = c.name;
      document.getElementById('upload-color-custom').value = '';
    };
    row.appendChild(sw);
  });
}

function onCategoryChange() { _syncSubtypes(); }

function _syncSubtypes() {
  const cat  = document.getElementById('upload-category')?.value;
  const sel  = document.getElementById('upload-subtype');
  if (!cat || !sel) return;
  const list = (typeof SUBTYPES_BY_CATEGORY !== 'undefined' ? SUBTYPES_BY_CATEGORY[cat] : null) || [];
  sel.innerHTML = list.map(s => `<option value="${s}">${s}</option>`).join('');
}

// ── Save item ─────────────────────────────────────────────────────────────────

function saveClothingItem() {
  const category = document.getElementById('upload-category').value;
  const subtype  = document.getElementById('upload-subtype').value;
  const custom   = (document.getElementById('upload-color-custom').value || '').trim();
  const color    = custom || _wColor;
  const pattern  = _activePill('pattern-group') || 'solid';
  const fit      = _activePill('fit-group')     || 'regular';

  if (!category) { showToast('Please select a category', 'error'); return; }
  if (!color)    { showToast('Please select or type a color', 'error'); return; }

  const item = {
    id:        String(Date.now()),
    category, subtype, color, pattern, fit,
    imageData: _wPhoto || null,
    addedAt:   Date.now()
  };

  _wItems.push(item);
  const ok = _save();

  if (ok) {
    closeUploadModal();
    _render();
    showToast(subtype + ' added ✦');
  } else {
    _wItems.pop(); // rollback
  }
}

// ── Item detail ───────────────────────────────────────────────────────────────

function _openDetail(id) {
  const item = _wItems.find(i => i.id === id);
  if (!item) return;
  _wItemId = id;

  const imgEl = document.getElementById('item-modal-img');
  const noImg = document.getElementById('item-modal-no-img');

  if (item.imageData) {
    imgEl.src = item.imageData; imgEl.style.display = 'block';
    noImg.classList.add('hidden');
  } else {
    imgEl.style.display = 'none'; imgEl.src = '';
    noImg.classList.remove('hidden');
    noImg.innerHTML = `<div style="font-size:4rem;text-align:center;padding:2rem">${_catEmoji(item.category)}</div>`;
  }

  document.getElementById('item-modal-title').textContent =
    item.color.charAt(0).toUpperCase() + item.color.slice(1) + ' ' + item.subtype;
  document.getElementById('item-modal-meta').textContent =
    item.category + ' · ' + item.pattern + ' · ' + item.fit + ' fit';
  document.getElementById('item-modal').classList.remove('hidden');
}

function closeItemModal() {
  document.getElementById('item-modal').classList.add('hidden');
  _wItemId = null;
}

function deleteCurrentItem() {
  if (!_wItemId) return;
  if (!confirm('Remove this item from your wardrobe?')) return;
  _wItems = _wItems.filter(i => i.id !== _wItemId);
  _save();
  closeItemModal();
  _render();
  showToast('Item removed');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _catEmoji(cat) {
  return {tops:'👕',bottoms:'👖',outerwear:'🧥',footwear:'👟',accessories:'⌚',ethnic:'🥻'}[cat]||'👗';
}

function _hexFor(colorName) {
  if (typeof COLORS === 'undefined') return null;
  return (COLORS.find(c => c.name === colorName) || {}).hex || null;
}

function _activePill(groupId) {
  return document.querySelector('#' + groupId + ' .pill.active')?.dataset.val || null;
}

function _resetPills(groupId, defaultVal) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.val === defaultVal);
  });
}

// Exposed for use in other modules (fashion-engine, outfit.js etc.)
function getWardrobeItems() { return _wItems; }

// ── Search & filter ───────────────────────────────────────────────────────────

function searchWardrobe(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) { _render(); return; }

  const grid  = document.getElementById('wardrobe-grid');
  const empty = document.getElementById('empty-state');
  const list  = _wItems.filter(i =>
    i.color.toLowerCase().includes(q) ||
    i.subtype.toLowerCase().includes(q) ||
    i.category.toLowerCase().includes(q) ||
    (i.pattern || '').toLowerCase().includes(q)
  );

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No items match "${q}"</p></div>`;
    return;
  }

  if (empty) empty.style.display = 'none';
  grid.innerHTML = '';

  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'wardrobe-item';
    el.onclick   = () => _openDetail(item.id);

    if (item.imageData) {
      el.innerHTML = `<img src="${item.imageData}" alt="${item.subtype}" loading="lazy" /><div class="wardrobe-item-badge">${item.subtype}</div>`;
    } else {
      const dot = _hexFor(item.color);
      el.innerHTML = `
        <div class="wardrobe-item-placeholder">
          <span>${_catEmoji(item.category)}</span>
          ${dot ? `<span class="wi-color-dot" style="background:${dot}"></span>` : ''}
          <span class="wi-label">${item.color}<br/>${item.subtype}</span>
        </div>`;
    }
    grid.appendChild(el);
  });
}

function sortWardrobe(by) {
  if (by === 'newest')   _wItems.sort((a,b) => b.addedAt - a.addedAt);
  if (by === 'oldest')   _wItems.sort((a,b) => a.addedAt - b.addedAt);
  if (by === 'category') _wItems.sort((a,b) => a.category.localeCompare(b.category));
  if (by === 'color')    _wItems.sort((a,b) => a.color.localeCompare(b.color));
  _render();
}
