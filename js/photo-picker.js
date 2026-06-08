/* ==========================================
   PHOTO-PICKER.JS — Universal Photo Picker
   Works across: Camera, Gallery, File upload
   Mobile-first bottom sheet UI
   ========================================== */

let _pickerCallback = null;
let _pickerContext  = null;

/**
 * Open the photo picker sheet.
 * @param {function} callback  - called with base64 dataUrl string
 * @param {object}   options   - { title, hint, capture }
 */
function openPhotoPicker(callback, options = {}) {
  _pickerCallback = callback;
  _pickerContext  = options;

  const sheet = document.getElementById('global-photo-picker');
  if (!sheet) { _buildPickerSheet(); }

  // Update title/hint
  document.getElementById('picker-title').textContent  = options.title || 'Add Photo';
  document.getElementById('picker-hint').textContent   = options.hint  || '';

  document.getElementById('global-photo-picker').classList.remove('hidden');
}

function closePhotoPicker() {
  const sheet = document.getElementById('global-photo-picker');
  if (sheet) sheet.classList.add('hidden');
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

        <button class="picker-option" onclick="triggerPickerInput('camera')">
          <div class="picker-option-icon">📷</div>
          <div class="picker-option-info">
            <div class="picker-option-label">Take Photo</div>
            <div class="picker-option-sub">Open camera</div>
          </div>
          <span class="picker-chevron">›</span>
        </button>

        <button class="picker-option" onclick="triggerPickerInput('gallery')">
          <div class="picker-option-icon">🖼️</div>
          <div class="picker-option-info">
            <div class="picker-option-label">Choose from Gallery</div>
            <div class="picker-option-sub">Photos & albums</div>
          </div>
          <span class="picker-chevron">›</span>
        </button>

        <button class="picker-option" onclick="triggerPickerInput('file')">
          <div class="picker-option-icon">📁</div>
          <div class="picker-option-info">
            <div class="picker-option-label">Browse Files</div>
            <div class="picker-option-sub">Documents, downloads</div>
          </div>
          <span class="picker-chevron">›</span>
        </button>

      </div>

      <!-- Hidden inputs for each source -->
      <!-- Camera capture -->
      <input type="file" id="picker-input-camera"
             accept="image/*" capture="environment"
             style="display:none"
             onchange="handlePickerFile(this)" />

      <!-- Gallery (no capture attr = shows gallery on mobile) -->
      <input type="file" id="picker-input-gallery"
             accept="image/*"
             style="display:none"
             onchange="handlePickerFile(this)" />

      <!-- File browser (broader accept) -->
      <input type="file" id="picker-input-file"
             accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
             style="display:none"
             onchange="handlePickerFile(this)" />

      <button class="btn-ghost full" style="margin-top:0.75rem"
              onclick="closePhotoPicker()">Cancel</button>
    </div>
  `;

  // Tap outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePhotoPicker();
  });

  document.body.appendChild(overlay);
}

function triggerPickerInput(source) {
  const inputId = {
    camera:  'picker-input-camera',
    gallery: 'picker-input-gallery',
    file:    'picker-input-file'
  }[source];

  const input = document.getElementById(inputId);
  if (!input) return;

  // Reset so same file can be re-selected
  input.value = '';
  input.click();
}

function handlePickerFile(input) {
  const file = input.files[0];
  if (!file) { closePhotoPicker(); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    closePhotoPicker();
    if (_pickerCallback) {
      _pickerCallback(e.target.result);
    }
  };
  reader.onerror = () => {
    closePhotoPicker();
    showToast('Could not read file. Try again.', 'error');
  };
  reader.readAsDataURL(file);
}
