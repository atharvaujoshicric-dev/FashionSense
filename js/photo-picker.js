/* ==========================================
   PHOTO-PICKER.JS — Universal Photo Picker
   Camera · Gallery · Files — bottom sheet UI
   ========================================== */

let _pickerCallback = null;

/**
 * openPhotoPicker(callback, options)
 * Shows a bottom sheet with Camera / Gallery / Files options.
 * callback receives a base64 dataUrl string.
 */
function openPhotoPicker(callback, options = {}) {
  _pickerCallback = callback;

  // Build sheet if not already in DOM
  if (!document.getElementById('global-photo-picker')) {
    _buildPickerSheet();
  }

  document.getElementById('picker-title').textContent = options.title || 'Add Photo';
  document.getElementById('picker-hint').textContent  = options.hint  || '';
  document.getElementById('global-photo-picker').classList.remove('hidden');
}

function closePhotoPicker() {
  const el = document.getElementById('global-photo-picker');
  if (el) el.classList.add('hidden');
  _pickerCallback = null;
}

function _buildPickerSheet() {
  const overlay = document.createElement('div');
  overlay.id        = 'global-photo-picker';
  overlay.className = 'modal-overlay hidden';
  overlay.innerHTML = `
    <div class="modal-sheet picker-sheet">
      <div class="modal-handle"></div>
      <h3 class="modal-title" id="picker-title">Add Photo</h3>
      <p class="picker-hint" id="picker-hint"></p>

      <div class="picker-options">

        <button type="button" class="picker-option" onclick="_triggerPicker('camera')">
          <div class="picker-option-icon">📷</div>
          <div class="picker-option-info">
            <div class="picker-option-label">Take Photo</div>
            <div class="picker-option-sub">Open camera now</div>
          </div>
          <span class="picker-chevron">›</span>
        </button>

        <button type="button" class="picker-option" onclick="_triggerPicker('gallery')">
          <div class="picker-option-icon">🖼️</div>
          <div class="picker-option-info">
            <div class="picker-option-label">Choose from Gallery</div>
            <div class="picker-option-sub">Photos &amp; albums</div>
          </div>
          <span class="picker-chevron">›</span>
        </button>

        <button type="button" class="picker-option" onclick="_triggerPicker('file')">
          <div class="picker-option-icon">📁</div>
          <div class="picker-option-info">
            <div class="picker-option-label">Browse Files</div>
            <div class="picker-option-sub">Documents, downloads</div>
          </div>
          <span class="picker-chevron">›</span>
        </button>

      </div>

      <!-- Three separate hidden inputs — each triggers a different OS dialog -->
      <input type="file" id="_picker-camera"  accept="image/*" capture="environment"
             style="display:none;position:absolute" onchange="_onPickerFile(this)" />
      <input type="file" id="_picker-gallery" accept="image/*"
             style="display:none;position:absolute" onchange="_onPickerFile(this)" />
      <input type="file" id="_picker-file"    accept="image/*,.heic,.heif"
             style="display:none;position:absolute" onchange="_onPickerFile(this)" />

      <button type="button" class="btn-ghost full" style="margin-top:0.75rem"
              onclick="closePhotoPicker()">Cancel</button>
    </div>
  `;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closePhotoPicker();
  });

  document.body.appendChild(overlay);
}

function _triggerPicker(source) {
  const ids = { camera: '_picker-camera', gallery: '_picker-gallery', file: '_picker-file' };
  const input = document.getElementById(ids[source]);
  if (!input) return;
  input.value = ''; // allow re-selecting same file
  input.click();
}

function _onPickerFile(input) {
  const file = input.files && input.files[0];
  if (!file) { closePhotoPicker(); return; }

  // Compress large images before storing to avoid quota issues
  const reader = new FileReader();
  reader.onload = e => {
    _compressImage(e.target.result, 1200, 0.82, (compressed) => {
      closePhotoPicker();
      if (_pickerCallback) _pickerCallback(compressed);
    });
  };
  reader.onerror = () => {
    closePhotoPicker();
    showToast('Could not read file. Try again.', 'error');
  };
  reader.readAsDataURL(file);
}

/**
 * Compress image to max dimension & quality using canvas.
 * This keeps localStorage usage manageable.
 */
function _compressImage(dataUrl, maxDim, quality, cb) {
  const img = new Image();
  img.onload = () => {
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
      else                { width  = Math.round(width  * maxDim / height); height = maxDim; }
    }
    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    try {
      cb(canvas.toDataURL('image/jpeg', quality));
    } catch (e) {
      cb(dataUrl); // fallback: use original
    }
  };
  img.onerror = () => cb(dataUrl);
  img.src = dataUrl;
}
