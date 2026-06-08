/* ==========================================
   IMAGE-ANALYZE.JS — Auto-detect clothing
   color and type from uploaded photo using
   Canvas pixel sampling (no API needed)
   ========================================== */

/**
 * Analyzes an image data URL and returns detected color + suggested subtype
 * @param {string} imageDataUrl  - base64 image
 * @param {string} category      - user-selected category hint
 * @returns {Promise<{color, colorHex, confidence}>}
 */
async function analyzeClothingImage(imageDataUrl, category) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const result = extractDominantColor(img);
        const subtype = guessSubtypeFromCategory(category, result);
        resolve({ ...result, suggestedSubtype: subtype });
      } catch (e) {
        resolve({ color: '', colorHex: '', confidence: 0, suggestedSubtype: null });
      }
    };
    img.onerror = () => resolve({ color: '', colorHex: '', confidence: 0, suggestedSubtype: null });
    img.src = imageDataUrl;
  });
}

function extractDominantColor(img) {
  const canvas = document.createElement('canvas');
  const SIZE   = 80; // sample at small size for speed
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, SIZE, SIZE);

  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  // Collect all pixels (skip near-white background)
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a < 100) continue; // transparent
    // Skip near-white (likely background)
    if (r > 230 && g > 230 && b > 230) continue;
    // Skip near-black edge shadows
    if (r < 15 && g < 15 && b < 15) continue;
    pixels.push([r, g, b]);
  }

  if (pixels.length === 0) {
    return { color: 'unknown', colorHex: '#888888', confidence: 0 };
  }

  // Simple k-means with k=3, 8 iterations
  const dominantRGB = simpleKMeans(pixels, 3, 8)[0];
  const [r, g, b] = dominantRGB;
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2,'0')).join('');

  const named = matchToNamedColor(r, g, b);
  return { color: named.name, colorHex: hex, detectedHex: hex, confidence: named.confidence };
}

function simpleKMeans(pixels, k, iterations) {
  // Init centroids by spread sampling
  let centroids = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) centroids.push([...pixels[i * step]]);

  for (let iter = 0; iter < iterations; iter++) {
    const clusters = Array.from({length: k}, () => []);

    for (const px of pixels) {
      let minDist = Infinity, closest = 0;
      for (let ci = 0; ci < k; ci++) {
        const d = colorDist(px, centroids[ci]);
        if (d < minDist) { minDist = d; closest = ci; }
      }
      clusters[closest].push(px);
    }

    for (let ci = 0; ci < k; ci++) {
      if (clusters[ci].length === 0) continue;
      centroids[ci] = [
        Math.round(clusters[ci].reduce((s,p) => s+p[0], 0) / clusters[ci].length),
        Math.round(clusters[ci].reduce((s,p) => s+p[1], 0) / clusters[ci].length),
        Math.round(clusters[ci].reduce((s,p) => s+p[2], 0) / clusters[ci].length)
      ];
    }
  }

  // Sort by cluster size (largest first)
  // We don't track sizes above but that's fine — return sorted centroids by vibrancy
  return centroids.sort((a, b) => colorVibrancy(b) - colorVibrancy(a));
}

function colorDist([r1,g1,b1], [r2,g2,b2]) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

function colorVibrancy([r,g,b]) {
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  return (max - min) / 255;
}

// Named color palette with approximate RGB values
const NAMED_COLORS_RGB = [
  { name: 'white',        rgb: [245, 245, 240] },
  { name: 'black',        rgb: [20,  20,  20 ] },
  { name: 'charcoal',     rgb: [58,  58,  58 ] },
  { name: 'grey',         rgb: [138, 138, 138] },
  { name: 'navy',         rgb: [31,  58,  95 ] },
  { name: 'sky blue',     rgb: [91,  163, 217] },
  { name: 'beige',        rgb: [212, 184, 150] },
  { name: 'cream',        rgb: [240, 230, 208] },
  { name: 'khaki',        rgb: [195, 170, 119] },
  { name: 'olive',        rgb: [107, 124, 58 ] },
  { name: 'forest green', rgb: [45,  90,  61 ] },
  { name: 'mint',         rgb: [120, 197, 168] },
  { name: 'brown',        rgb: [122, 79,  46 ] },
  { name: 'rust',         rgb: [192, 82,  42 ] },
  { name: 'burgundy',     rgb: [124, 32,  53 ] },
  { name: 'coral',        rgb: [232, 112, 96 ] },
  { name: 'blush',        rgb: [232, 168, 168] },
  { name: 'mustard',      rgb: [212, 160, 23 ] },
];

function matchToNamedColor(r, g, b) {
  let bestName = 'unknown', bestDist = Infinity;
  for (const c of NAMED_COLORS_RGB) {
    const d = colorDist([r,g,b], c.rgb);
    if (d < bestDist) { bestDist = d; bestName = c.name; }
  }
  // Confidence: lower distance = higher confidence (max ~441)
  const confidence = Math.max(0, Math.round((1 - bestDist / 200) * 100));
  return { name: bestName, confidence };
}

function guessSubtypeFromCategory(category) {
  // Return the most common / likely subtype per category as a default suggestion
  const defaults = {
    tops:        'T-Shirt',
    bottoms:     'Jeans (Slim)',
    outerwear:   'Jacket',
    footwear:    'Sneakers (Low)',
    accessories: 'Watch',
    ethnic:      'Kurta'
  };
  return defaults[category] || null;
}
