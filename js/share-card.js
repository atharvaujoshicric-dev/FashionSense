/* ==========================================
   SHARE-CARD.JS — Generate shareable outfit card
   Uses canvas to render a lookbook-style image
   ========================================== */

async function generateShareCard(outfit, username) {
  const canvas  = document.createElement('canvas');
  canvas.width  = 800;
  canvas.height = 1000;
  const ctx     = canvas.getContext('2d');

  const isDark = (localStorage.getItem('styleai_theme') || 'dark') === 'dark';
  const bg     = isDark ? '#0a0a0f' : '#f5f3ef';
  const fg     = isDark ? '#f0efe8' : '#1a1814';
  const accent = isDark ? '#c9a96e' : '#9a6f30';
  const card   = isDark ? '#13131a' : '#ffffff';

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 800, 1000);

  // Top accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 800, 6);

  // Title
  ctx.fillStyle = accent;
  ctx.font      = '300 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦ StyleAI', 400, 55);

  ctx.fillStyle = fg;
  ctx.font      = '400 42px Georgia, serif';
  ctx.fillText(outfit.outfitName || 'My Outfit', 400, 105);

  ctx.fillStyle = isDark ? '#9898b0' : '#5a5650';
  ctx.font      = '300 20px Georgia, serif';
  ctx.fillText(outfit.occasion ? outfit.occasion.toUpperCase() : 'CASUAL', 400, 135);

  // Outfit piece images in a grid
  const slots   = (outfit.slots || []).slice(0, 4);
  const cols    = slots.length <= 2 ? slots.length : 2;
  const rows    = Math.ceil(slots.length / cols);
  const cellW   = 340;
  const cellH   = 340;
  const gapX    = 20;
  const gapY    = 20;
  const totalW  = cols * cellW + (cols - 1) * gapX;
  const startX  = (800 - totalW) / 2;
  const startY  = 165;

  for (let i = 0; i < slots.length; i++) {
    const col  = i % cols;
    const row  = Math.floor(i / cols);
    const x    = startX + col * (cellW + gapX);
    const y    = startY + row * (cellH + gapY);

    // Card background
    _roundRect(ctx, x, y, cellW, cellH, 16, card);

    const slot = slots[i];
    if (slot.item?.imageData) {
      try {
        await _drawImage(ctx, slot.item.imageData, x + 10, y + 10, cellW - 20, cellH - 60);
      } catch {}
    } else {
      // Emoji fallback
      ctx.font      = '80px serif';
      ctx.textAlign = 'center';
      ctx.fillText(_catEmoji(slot.item?.category), x + cellW / 2, y + cellH / 2 - 10);
    }

    // Label at bottom of card
    ctx.fillStyle = isDark ? '#9898b0' : '#5a5650';
    ctx.font      = '500 15px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slot.label || '', x + cellW / 2, y + cellH - 30);

    ctx.fillStyle = fg;
    ctx.font      = '400 17px DM Sans, sans-serif';
    const itemName = (slot.item?.color || '') + ' ' + (slot.item?.subtype || '');
    ctx.fillText(_truncate(itemName, 28), x + cellW / 2, y + cellH - 10);
  }

  // Bottom: username + date
  const bottomY = startY + rows * (cellH + gapY) + 30;
  ctx.fillStyle = isDark ? '#5a5a72' : '#9a9590';
  ctx.font      = '300 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('@' + username + ' · StyleAI · ' + new Date().toLocaleDateString('en-IN',{month:'short',year:'numeric'}), 400, bottomY + 20);

  // Bottom accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 994, 800, 6);

  return canvas.toDataURL('image/jpeg', 0.92);
}

function _roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function _drawImage(ctx, src, x, y, w, h) {
  return new Promise((resolve, reject) => {
    const img  = new Image();
    img.onload = () => {
      // Cover crop
      const iw = img.width, ih = img.height;
      const scale = Math.max(w / iw, h / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}

function _catEmoji(cat) {
  return {tops:'👕',bottoms:'👖',outerwear:'🧥',footwear:'👟',accessories:'⌚',ethnic:'🥻'}[cat]||'👗';
}

function _truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

// ── Share card modal ──────────────────────────────────────────────────────────

async function showShareCard(outfit, username) {
  showToast('Generating card…');
  let dataUrl;
  try {
    dataUrl = await generateShareCard(outfit, username);
  } catch(e) {
    showToast('Could not generate card', 'error');
    console.warn(e);
    return;
  }

  // Build or reuse modal
  let modal = document.getElementById('share-card-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id        = 'share-card-modal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div class="modal-sheet" style="align-items:center;text-align:center">
        <div class="modal-handle"></div>
        <h3 class="modal-title">Your Outfit Card</h3>
        <img id="share-card-img" style="width:100%;border-radius:12px;margin-bottom:1rem" />
        <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:1rem">Long press the image to save, or tap Share</p>
        <div class="modal-actions">
          <button class="btn-ghost" onclick="document.getElementById('share-card-modal').classList.add('hidden')">Close</button>
          <button class="btn-primary" onclick="_shareCard()">Share ↗</button>
        </div>
      </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
    document.body.appendChild(modal);
  }

  document.getElementById('share-card-img').src = dataUrl;
  modal.classList.remove('hidden');
  modal._dataUrl = dataUrl;
}

async function _shareCard() {
  const modal  = document.getElementById('share-card-modal');
  const dataUrl= modal?._dataUrl;
  if (!dataUrl) return;

  // Convert base64 to blob
  const blob = await (await fetch(dataUrl)).blob();
  const file  = new File([blob], 'styleai-outfit.jpg', { type: 'image/jpeg' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My StyleAI Outfit', text: 'Check out my outfit from StyleAI ✦' });
      return;
    } catch {}
  }

  // Fallback: trigger download
  const a = document.createElement('a');
  a.href     = dataUrl;
  a.download = 'styleai-outfit.jpg';
  a.click();
}
