/* ==========================================
   PHOTO-PICKER.JS — Universal Photo Picker
   Camera · Gallery · Files — bottom sheet UI
   ========================================== */

let _pickerCallback = null;

function openPhotoPicker(callback, options = {}) {
  _pickerCallback = callback;

  if (!document.getElementById('_gpp')) _buildPickerSheet();

  document.getElementById('_ppt').textContent = options.title || 'Add Photo';
  document.getElementById('_pph').textContent = options.hint  || '';
  document.getElementById('_gpp').classList.remove('hidden');
}

function closePhotoPicker() {
  const el = document.getElementById('_gpp');
  if (el) el.classList.add('hidden');
  // NOTE: do NOT null _pickerCallback here — it's nulled after calling it
}

function _buildPickerSheet() {
  const overlay = document.createElement('div');
  overlay.id        = '_gpp';
  overlay.className = 'modal-overlay hidden';
  overlay.innerHTML = `
    <div class="modal-sheet picker-sheet">
      <div class="modal-handle"></div>
      <h3 class="modal-title" id="_ppt">Add Photo</h3>
      <p class="picker-hint" id="_pph"></p>
      <div class="picker-options">
        <button type="button" class="picker-option" onclick="_pp('camera')">
          <div class="picker-option-icon">📷</div>
          <div class="picker-option-info">
            <div class="picker-option-label">Take Photo</div>
            <div class="picker-option-sub">Open camera</div>
          </div>
          <span class="picker-chevron">›</span>
        </button>
        <button type="button" class="picker-option" onclick="_pp('gallery')">
          <div class="picker-option-icon">🖼️</div>
          <div class="picker-option-info">
            <div class="picker-option-label">Choose from Gallery</div>
            <div class="picker-option-sub">Photos &amp; albums</div>
          </div>
          <span class="picker-chevron">›</span>
        </button>
        <button type="button" class="picker-option" onclick="_pp('file')">
          <div class="picker-option-icon">📁</div>
          <div class="picker-option-info">
            <div class="picker-option-label">Browse Files</div>
            <div class="picker-option-sub">Documents, downloads</div>
          </div>
          <span class="picker-chevron">›</span>
        </button>
      </div>

      <!-- Separate inputs: camera uses capture="environment", gallery/file don't -->
      <input type="file" id="_ppi-c" accept="image/*" capture="environment"
             style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"
             onchange="_ppFile(this)" />
      <input type="file" id="_ppi-g" accept="image/*"
             style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"
             onchange="_ppFile(this)" />
      <input type="file" id="_ppi-f" accept="image/*,.heic,.heif"
             style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"
             onchange="_ppFile(this)" />

      <button type="button" class="btn-ghost full" style="margin-top:0.75rem"
              onclick="closePhotoPicker()">Cancel</button>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) closePhotoPicker(); });
  document.body.appendChild(overlay);
}

function _pp(source) {
  // Map source to the correct input element and trigger it
  const map = { camera: '_ppi-c', gallery: '_ppi-g', file: '_ppi-f' };
  const el  = document.getElementById(map[source]);
  if (!el) return;
  el.value = ''; // allow re-selecting same file
  el.click();
}

function _ppFile(input) {
  const file = input.files && input.files[0];
  if (!file) return; // don't close — user may try again

  const cb = _pickerCallback; // capture NOW before any async/close
  _pickerCallback = null;     // clear for next usage

  closePhotoPicker();         // hide the sheet

  // Read file as base64
  const reader = new FileReader();
  reader.onload = e => {
    // Compress to save storage space
    _compress(e.target.result, 1100, 0.80, result => {
      if (cb) cb(result);
    });
  };
  reader.onerror = () => {
    if (typeof showToast === 'function') showToast('Could not read file', 'error');
  };
  reader.readAsDataURL(file);
}

function _compress(dataUrl, maxPx, quality, cb) {
  const img = new Image();
  img.onload = () => {
    try {
      let w = img.naturalWidth  || img.width;
      let h = img.naturalHeight || img.height;
      if (!w || !h) { cb(dataUrl); return; }

      if (w > maxPx || h > maxPx) {
        if (w >= h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else        { w = Math.round(w * maxPx / h); h = maxPx; }
      }

      const c = document.createElement('canvas');
      c.width  = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const out = c.toDataURL('image/jpeg', quality);
      cb(out.length > 100 ? out : dataUrl); // sanity check
    } catch(e) {
      cb(dataUrl);
    }
  };
  img.onerror = () => cb(dataUrl);
  img.src = dataUrl;
}
