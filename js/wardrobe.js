/* ==========================================
   WARDROBE.JS — Wardrobe Management
   ========================================== */

let currentUser = null;
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
  initSubtypeSync();
});

// ---- Storage ----

function loadWardrobe() {
  try {
    return JSON.parse(localStorage.getItem('styleai_wardrobe_' + currentUser.username)) || [];
  } catch { return []; }
}

function saveWardrobe() {
  localStorage.setItem('styleai_wardrobe_' + currentUser.username, JSON.stringify(wardrobeItems));
}

// ---- Render ----

function renderWardrobe() {
  const grid = document.getElementById('wardrobe-grid');
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
          <span>${item.color} ${item.subtype}</span>
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
  const map = { tops: '👕', bottoms: '👖', outerwear: '🧥', footwear: '👟', accessories: '⌚', ethnic: '🥻' };
  return map[cat] || '👗';
}

// ---- Upload Modal ----

function openUploadModal() {
  document.getElementById('upload-modal').classList.remove('hidden');
  document.getElementById('photo-preview').classList.add('hidden');
  document.getElementById('photo-placeholder').style.display = 'flex';
  document.getElementById('upload-file-input').value = '';
  selectedColor = '';
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.add('hidden');
}

function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('photo-preview');
    const placeholder = document.getElementById('photo-placeholder');
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function renderColorPicker() {
  const row = document.getElementById('color-picker-row');
  if (!row) return;
  COLORS.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch';
    sw.style.backgroundColor = c.hex;
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

function initSubtypeSync() {
  const catSel = document.getElementById('upload-category');
  const subSel = document.getElementById('upload-subtype');
  if (!catSel || !subSel) return;

  function updateSubtypes() {
    const cat = catSel.value;
    const subtypes = SUBTYPES_BY_CATEGORY[cat] || [];
    subSel.innerHTML = subtypes.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  catSel.addEventListener('change', updateSubtypes);
  updateSubtypes();
}

function saveClothingItem() {
  const category = document.getElementById('upload-category').value;
  const subtype  = document.getElementById('upload-subtype').value;
  const customColor = document.getElementById('upload-color-custom').value.trim();
  const color = customColor || selectedColor || 'unknown';
  const pattern = getSelectedPill('pattern-group') || 'solid';
  const fit     = getSelectedPill('fit-group') || 'regular';
  const preview = document.getElementById('photo-preview');
  const imageData = preview && !preview.classList.contains('hidden') ? preview.src : null;

  if (!color || color === 'unknown') {
    showToast('Please select or type a color', 'error'); return;
  }

  const item = {
    id: Date.now().toString(),
    category, subtype, color, pattern, fit,
    imageData,
    addedAt: Date.now()
  };

  wardrobeItems.push(item);
  saveWardrobe();
  closeUploadModal();
  renderWardrobe();
  showToast(`${subtype} added to wardrobe ✦`);
}

// ---- Item Modal ----

function openItemModal(id) {
  const item = wardrobeItems.find(i => i.id === id);
  if (!item) return;
  currentItemId = id;

  document.getElementById('item-modal-img').src = item.imageData || '';
  document.getElementById('item-modal-img').style.display = item.imageData ? 'block' : 'none';
  document.getElementById('item-modal-title').textContent = `${item.color} ${item.subtype}`;
  document.getElementById('item-modal-meta').textContent =
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
