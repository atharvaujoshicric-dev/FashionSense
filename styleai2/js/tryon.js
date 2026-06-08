/* ==========================================
   TRYON.JS — Virtual Try-On Renderer
   ========================================== */

function renderTryOn(userPhotoDataUrl, slots, container) {
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'tryon-wrap';

  // ── Left: user photo with dot badges ──────────────────────────────────────
  const photoCol = document.createElement('div');
  photoCol.className = 'tryon-photo-col';

  const label = document.createElement('div');
  label.className   = 'tryon-label';
  label.textContent = 'Your Look';

  const overlayWrap = document.createElement('div');
  overlayWrap.className = 'tryon-overlay-wrap';

  const photoImg = document.createElement('img');
  photoImg.src       = userPhotoDataUrl;
  photoImg.className = 'tryon-user-photo';
  photoImg.alt       = 'Your photo';
  overlayWrap.appendChild(photoImg);

  // Position badges over approximate body zones
  const ZONES = {
    top:       { top: '28%', left: '50%' },
    bottom:    { top: '58%', left: '50%' },
    outerwear: { top: '22%', left: '14%' },
    footwear:  { top: '85%', left: '50%' },
    accessory: { top: '12%', left: '80%' }
  };
  const SLOT_EMOJI = {
    top:'👕', bottom:'👖', outerwear:'🧥', footwear:'👟', accessory:'⌚'
  };

  slots.forEach(slot => {
    const zone = ZONES[slot.role];
    if (!zone) return;

    const badge = document.createElement('div');
    badge.className  = 'tryon-zone-badge';
    badge.style.top  = zone.top;
    badge.style.left = zone.left;
    badge.title      = `${slot.item.color} ${slot.item.subtype}`;

    if (slot.item.imageData) {
      const img = document.createElement('img');
      img.src       = slot.item.imageData;
      img.className = 'tryon-badge-img';
      badge.appendChild(img);
    } else {
      badge.textContent = SLOT_EMOJI[slot.role] || '👕';
      badge.style.fontSize = '1rem';
    }
    overlayWrap.appendChild(badge);
  });

  photoCol.appendChild(label);
  photoCol.appendChild(overlayWrap);

  // ── Right: piece cards ─────────────────────────────────────────────────────
  const cardsCol = document.createElement('div');
  cardsCol.className = 'tryon-cards-col';

  const cardsLabel = document.createElement('div');
  cardsLabel.className   = 'tryon-label';
  cardsLabel.textContent = 'Outfit Pieces';
  cardsCol.appendChild(cardsLabel);

  slots.forEach(slot => {
    const card = document.createElement('div');
    card.className = 'tryon-piece-card';

    const imgEl = document.createElement('div');
    if (slot.item.imageData) {
      imgEl.innerHTML = `<img src="${slot.item.imageData}" class="tryon-piece-img" />`;
    } else {
      imgEl.className    = 'tryon-piece-placeholder';
      imgEl.textContent  = _catEmoji(slot.item.category);
    }

    const info = document.createElement('div');
    info.innerHTML = `
      <div class="tryon-piece-role">${slot.label}</div>
      <div class="tryon-piece-name">${slot.item.color} ${slot.item.subtype}</div>
    `;

    card.appendChild(imgEl);
    card.appendChild(info);
    cardsCol.appendChild(card);
  });

  wrap.appendChild(photoCol);
  wrap.appendChild(cardsCol);
  container.appendChild(wrap);
}

function renderTryOnNoPhoto(container, onUploadFnName) {
  // onUploadFnName is a string like 'openBodyPhotoUpload' — safe to call
  container.innerHTML = `
    <div class="tryon-no-photo">
      <div class="tryon-no-photo-icon">🧍</div>
      <p>Add your full-body photo to visualise this outfit on you</p>
      <button type="button" class="btn-primary"
              onclick="${onUploadFnName}()"
              style="margin-top:0.75rem;padding:0.65rem 1.5rem;font-size:0.88rem">
        Add My Photo
      </button>
    </div>
  `;
}

function _catEmoji(cat) {
  return { tops:'👕', bottoms:'👖', outerwear:'🧥', footwear:'👟', accessories:'⌚', ethnic:'🥻' }[cat] || '👗';
}
