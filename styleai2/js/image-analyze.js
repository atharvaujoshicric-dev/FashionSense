/* ==========================================
   IMAGE-ANALYZE.JS
   Detects dominant clothing color from photo
   using Canvas pixel sampling — no API needed
   ========================================== */

/**
 * Main entry point.
 * @param {string} dataUrl  — base64 image (from photo picker)
 * @param {string} category — user-selected category hint
 * @returns {Promise<{color, detectedHex, confidence, suggestedSubtype}>}
 */
function analyzeClothingImage(dataUrl, category) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      resolve(_fallback()); return;
    }

    const img = new Image();

    // Must set before src for data URLs on strict browsers
    img.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      resolve(_fallback());
    }, 5000); // give up after 5s

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const rgb    = _getDominantRGB(img);
        const named  = _matchColor(rgb[0], rgb[1], rgb[2]);
        const hex    = _toHex(rgb[0], rgb[1], rgb[2]);
        resolve({
          color:           named.name,
          detectedHex:     hex,
          confidence:      named.confidence,
          suggestedSubtype: _defaultSubtype(category)
        });
      } catch (err) {
        // Canvas security error — return fallback
        console.warn('image-analyze canvas error:', err.message);
        resolve(_fallback());
      }
    };

    img.onerror = () => { clearTimeout(timeout); resolve(_fallback()); };

    img.src = dataUrl;
  });
}

function _fallback() {
  return { color: '', detectedHex: '', confidence: 0, suggestedSubtype: null };
}

// ── Pixel sampling ────────────────────────────────────────────────────────────

function _getDominantRGB(img) {
  // Downsample to 100x100 for speed
  const SIZE   = 100;
  const canvas = document.createElement('canvas');
  canvas.width  = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // willReadFrequently hint (Chrome 97+)
  // Re-get context with hint if possible
  const ctx2 = canvas.getContext('2d', { willReadFrequently: true }) || ctx;
  ctx2.drawImage(img, 0, 0, SIZE, SIZE);

  let data;
  try {
    data = ctx2.getImageData(0, 0, SIZE, SIZE).data;
  } catch (e) {
    throw new Error('Canvas tainted: ' + e.message);
  }

  // Bucket pixels — skip near-white background and near-black shadows
  const buckets = {};
  let   total   = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a < 128) continue;

    // Skip background-ish pixels
    const brightness = (r + g + b) / 3;
    if (brightness > 235) continue; // near white
    if (brightness < 12)  continue; // near black

    // Quantize to reduce noise (bin to nearest 20)
    const qr = Math.round(r / 20) * 20;
    const qg = Math.round(g / 20) * 20;
    const qb = Math.round(b / 20) * 20;
    const key = `${qr},${qg},${qb}`;
    buckets[key] = (buckets[key] || 0) + 1;
    total++;
  }

  if (total === 0) {
    // All pixels were background — try again without background filter
    return _getDominantRGBNoFilter(data);
  }

  // Find the most common bucket
  let bestKey = null, bestCount = 0;
  for (const [key, count] of Object.entries(buckets)) {
    if (count > bestCount) { bestCount = count; bestKey = key; }
  }

  const [r, g, b] = bestKey.split(',').map(Number);
  return [r, g, b];
}

function _getDominantRGBNoFilter(data) {
  // Fallback: just average all opaque pixels
  let tr = 0, tg = 0, tb = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] < 128) continue;
    tr += data[i]; tg += data[i+1]; tb += data[i+2]; n++;
  }
  if (n === 0) return [128, 128, 128];
  return [Math.round(tr/n), Math.round(tg/n), Math.round(tb/n)];
}

// ── Color matching ────────────────────────────────────────────────────────────

const PALETTE = [
  { name: 'white',        rgb: [245, 245, 240] },
  { name: 'cream',        rgb: [240, 230, 210] },
  { name: 'black',        rgb: [25,  25,  25 ] },
  { name: 'charcoal',     rgb: [60,  60,  60 ] },
  { name: 'grey',         rgb: [140, 140, 140] },
  { name: 'navy',         rgb: [28,  55,  100] },
  { name: 'sky blue',     rgb: [90,  160, 220] },
  { name: 'beige',        rgb: [215, 190, 155] },
  { name: 'khaki',        rgb: [195, 175, 120] },
  { name: 'olive',        rgb: [100, 120, 55 ] },
  { name: 'forest green', rgb: [40,  85,  55 ] },
  { name: 'mint',         rgb: [115, 200, 170] },
  { name: 'brown',        rgb: [125, 80,  45 ] },
  { name: 'rust',         rgb: [195, 80,  40 ] },
  { name: 'burgundy',     rgb: [120, 30,  50 ] },
  { name: 'coral',        rgb: [230, 110, 90 ] },
  { name: 'blush',        rgb: [235, 170, 165] },
  { name: 'mustard',      rgb: [210, 165, 25 ] },
  { name: 'pink',         rgb: [230, 130, 160] },
  { name: 'purple',       rgb: [120, 60,  180] },
  { name: 'red',          rgb: [200, 35,  35 ] },
  { name: 'orange',       rgb: [220, 120, 40 ] },
  { name: 'yellow',       rgb: [220, 200, 50 ] },
  { name: 'denim blue',   rgb: [70,  110, 160] },
];

function _matchColor(r, g, b) {
  let best = null, bestDist = Infinity;
  for (const c of PALETTE) {
    const d = _dist(r, g, b, c.rgb[0], c.rgb[1], c.rgb[2]);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  // Max possible dist ≈ 441; below 80 = good match
  const confidence = Math.max(0, Math.round((1 - bestDist / 250) * 100));
  return { name: best?.name || 'unknown', confidence };
}

function _dist(r1,g1,b1,r2,g2,b2) {
  // Weighted Euclidean (human eye is more sensitive to green)
  return Math.sqrt(
    2 * (r1-r2)**2 +
    4 * (g1-g2)**2 +
    3 * (b1-b2)**2
  );
}

function _toHex(r, g, b) {
  return '#' + [r,g,b].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
}

function _defaultSubtype(category) {
  return {
    tops: 'T-Shirt', bottoms: 'Jeans (Slim)',
    outerwear: 'Bomber Jacket', footwear: 'Sneakers (Low)',
    accessories: 'Watch', ethnic: 'Kurta'
  }[category] || null;
}
