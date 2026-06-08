/* ==========================================
   TRYON.JS — Virtual Try-On via Canvas
   Overlays outfit cards on user's photo
   ========================================== */

/**
 * Renders a virtual try-on composite image on a <canvas> element.
 * Uses CSS-based overlay approach since we don't have body segmentation.
 * Shows outfit pieces in a styled card grid beside/over the user photo.
 *
 * @param {string}   userPhotoDataUrl - user's full-body photo
 * @param {Array}    slots            - outfit slots [{role, item, label}]
 * @param {HTMLElement} container     - DOM element to render into
 */
function renderTryOn(userPhotoDataUrl, slots, container) {
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'tryon-wrap';

  // ── User photo side ───────────────────────────────────────────────────────
  const photoCol = document.createElement('div');
  photoCol.className = 'tryon-photo-col';

  const photoLabel = document.createElement('div');
  photoLabel.className = 'tryon-label';
  photoLabel.textContent = 'Your Look';

  const photoImg = document.createElement('img');
  photoImg.src   = userPhotoDataUrl;
  photoImg.className = 'tryon-user-photo';
  photoImg.alt   = 'Your photo';

  // Overlay badges for each outfit piece on the photo
  const overlayWrap = document.createElement('div');
  overlayWrap.className = 'tryon-overlay-wrap';
  overlayWrap.appendChild(photoImg);

  // Position labels over body zones
  const ZONE_MAP = {
    top:       { top: '28%', left: '50%', label: '👕' },
    bottom:    { top: '58%', left: '50%', label: '👖' },
    outerwear: { top: '22%', left: '10%', label: '🧥' },
    footwear:  { top: '84%', left: '50%', label: '👟' },
    accessory: { top: '14%', left: '82%', label: '⌚' }
  };

  slots.forEach(slot => {
    const zone = ZONE_MAP[slot.role];
    if (!zone) return;

    const badge = document.createElement('div');
    badge.className = 'tryon-zone-badge';
    badge.style.top  = zone.top;
    badge.style.left = zone.left;
    badge.title = `${slot.item.color} ${slot.item.subtype}`;

    const thumb = slot.item.imageData
      ? `<img src="${slot.item.imageData}" class="tryon-badge-img" />`
      : `<span class="tryon-badge-emoji">${zone.label}</span>`;

    badge.innerHTML = thumb;
    overlayWrap.appendChild(badge);
  });

  photoCol.appendChild(photoLabel);
  photoCol.appendChild(overlayWrap);

  // ── Outfit cards side ─────────────────────────────────────────────────────
  const cardsCol = document.createElement('div');
  cardsCol.className = 'tryon-cards-col';

  const cardsLabel = document.createElement('div');
  cardsLabel.className = 'tryon-label';
  cardsLabel.textContent = 'Outfit Pieces';
  cardsCol.appendChild(cardsLabel);

  slots.forEach(slot => {
    const card = document.createElement('div');
    card.className = 'tryon-piece-card';

    const imgEl = slot.item.imageData
      ? `<img src="${slot.item.imageData}" class="tryon-piece-img" />`
      : `<div class="tryon-piece-placeholder">${getCategoryEmoji(slot.item.category)}</div>`;

    card.innerHTML = `
      ${imgEl}
      <div class="tryon-piece-info">
        <div class="tryon-piece-role">${slot.label}</div>
        <div class="tryon-piece-name">${slot.item.color} ${slot.item.subtype}</div>
      </div>
    `;
    cardsCol.appendChild(card);
  });

  wrap.appendChild(photoCol);
  wrap.appendChild(cardsCol);
  container.appendChild(wrap);
}

/**
 * Renders a "no photo" prompt card
 */
function renderTryOnNoPhoto(container, onUpload) {
  container.innerHTML = `
    <div class="tryon-no-photo">
      <div class="tryon-no-photo-icon">🧍</div>
      <p>Add your full-body photo to see how this outfit looks on you</p>
      <button class="btn-primary" onclick="(${onUpload.toString()})()">Add My Photo</button>
    </div>
  `;
}

function getCategoryEmoji(cat) {
  const m = { tops:'👕', bottoms:'👖', outerwear:'🧥', footwear:'👟', accessories:'⌚', ethnic:'🥻' };
  return m[cat] || '👗';
}
