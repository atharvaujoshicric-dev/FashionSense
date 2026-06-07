/* ==========================================
   FASHION-ENGINE.JS — Core Styling Intelligence
   StyleAI · June 2026 Trend Database
   ========================================== */

/**
 * Main outfit generation engine
 * Applies color theory, body type rules, climate awareness, and 2026 trends
 */
function generateOutfitSuggestion(wardrobe, user, occasion, city) {
  const climate = CITY_CLIMATE[city] || 'temperate';
  const rules = OCCASION_RULES[occasion] || OCCASION_RULES.casual;

  // Categorise wardrobe
  const byCategory = {};
  wardrobe.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  // Pick a top
  const tops = [...(byCategory.tops || []), ...(occasion === 'ethnic' ? (byCategory.ethnic || []) : [])];
  if (tops.length === 0) return null;

  const top = weightedPick(tops, occasion, climate, user.bodyType);

  // Pick compatible bottom
  let bottomPool = [...(byCategory.bottoms || [])];
  if (occasion === 'ethnic') bottomPool = [...(byCategory.ethnic || []), ...bottomPool];

  const bottom = bottomPool.length > 0
    ? pickCompatibleBottom(top, bottomPool, occasion, user.bodyType)
    : null;

  // Pick outerwear (optional, based on climate & occasion)
  let outerwear = null;
  const needsOuterwear = shouldAddOuterwear(climate, occasion);
  if (needsOuterwear && byCategory.outerwear?.length > 0) {
    outerwear = pickCompatibleOuterwear(top, bottom, byCategory.outerwear, occasion);
  }

  // Pick footwear
  const footwear = byCategory.footwear?.length > 0
    ? pickFootwear(byCategory.footwear, occasion, climate)
    : null;

  // Pick accessory (optional)
  const accessory = byCategory.accessories?.length > 0 && Math.random() > 0.4
    ? pickAccessory(byCategory.accessories, occasion)
    : null;

  // Build outfit object
  const slots = [];
  if (top) slots.push({ role: 'top', item: top, label: 'Top' });
  if (bottom) slots.push({ role: 'bottom', item: bottom, label: 'Bottom' });
  if (outerwear) slots.push({ role: 'outerwear', item: outerwear, label: 'Layer' });
  if (footwear) slots.push({ role: 'footwear', item: footwear, label: 'Footwear' });
  if (accessory) slots.push({ role: 'accessory', item: accessory, label: 'Accessory' });

  const outfitName = generateOutfitName(slots, occasion, user.gender);
  const outfitDesc = generateOutfitDesc(slots, occasion, climate, user.bodyType);
  const tips = getStylingTips(occasion, user.bodyType, slots);
  const palette = buildPalette(slots);

  return { slots, outfitName, outfitDesc, tips, palette };
}

// ---- Pickers ----

function weightedPick(items, occasion, climate, bodyType) {
  // Score each item by how well it fits the occasion and climate
  const scored = items.map(item => ({
    item,
    score: scoreItem(item, occasion, climate, bodyType)
  }));
  scored.sort((a, b) => b.score - a.score);

  // Pick from top candidates with some randomness
  const topN = Math.min(scored.length, Math.ceil(scored.length * 0.6) || 1);
  const pool = scored.slice(0, topN);
  return pool[Math.floor(Math.random() * pool.length)].item;
}

function scoreItem(item, occasion, climate, bodyType) {
  let score = 50;

  // Climate scoring
  const lightColors = ['white', 'beige', 'cream', 'sky blue', 'mint', 'blush'];
  const darkColors = ['navy', 'black', 'charcoal', 'forest green', 'burgundy'];

  if (['tropical', 'desert'].includes(climate)) {
    if (lightColors.includes(item.color)) score += 20;
    if (['linen shirt', 'polo', 't-shirt'].some(t => item.subtype?.toLowerCase().includes(t))) score += 15;
  }
  if (['continental', 'oceanic'].includes(climate)) {
    if (darkColors.includes(item.color)) score += 10;
  }

  // Occasion scoring
  if (occasion === 'work') {
    if (['shirt (formal)', 'shirt (casual)', 'polo'].some(t => item.subtype?.toLowerCase().includes(t))) score += 20;
    if (item.pattern === 'solid' || item.pattern === 'striped') score += 10;
  }
  if (occasion === 'party') {
    if (item.pattern !== 'solid') score += 10;
    if (['burgundy', 'navy', 'black', 'rust', 'mustard'].includes(item.color)) score += 15;
  }
  if (occasion === 'gym') {
    if (['t-shirt', 'tank top', 'hoodie'].some(t => item.subtype?.toLowerCase().includes(t))) score += 30;
  }
  if (occasion === 'ethnic') {
    if (item.category === 'ethnic') score += 40;
  }
  if (occasion === 'beach') {
    if (lightColors.includes(item.color)) score += 20;
    if (['t-shirt', 'linen shirt', 'tank top'].some(t => item.subtype?.toLowerCase().includes(t))) score += 15;
  }

  // Body type scoring
  if (bodyType === 'broad' && item.pattern === 'horizontal') score -= 15;
  if (bodyType === 'slim' && item.fit === 'oversized') score -= 5;

  return score + (Math.random() * 20); // slight randomness
}

function pickCompatibleBottom(top, bottoms, occasion, bodyType) {
  // Score bottoms by color compatibility
  const scored = bottoms.map(b => ({
    item: b,
    score: getColorScore(top.color, b.color) + scoreBottomForOccasion(b, occasion)
  }));
  scored.sort((a, b) => b.score - a.score);
  const topN = Math.min(scored.length, 3);
  const pool = scored.slice(0, topN);
  return pool[Math.floor(Math.random() * pool.length)].item;
}

function getColorScore(color1, color2) {
  if (!color1 || !color2) return 50;
  if (color1 === color2) return 20; // same color is ok but not ideal (monochrome)
  const pairs = COLOR_PAIRS[color1] || [];
  if (pairs.includes(color2)) return 100;
  // Neutrals with anything
  const neutrals = ['white', 'black', 'grey', 'beige', 'cream', 'charcoal'];
  if (neutrals.includes(color1) || neutrals.includes(color2)) return 75;
  return 40;
}

function scoreBottomForOccasion(item, occasion) {
  let score = 0;
  const subtype = (item.subtype || '').toLowerCase();
  if (occasion === 'work') {
    if (subtype.includes('trousers') || subtype.includes('chinos')) score += 20;
    if (subtype.includes('jeans (slim)') || subtype.includes('jeans (straight)')) score += 10;
  }
  if (occasion === 'casual') {
    if (subtype.includes('jeans') || subtype.includes('chinos') || subtype.includes('cargo')) score += 15;
  }
  if (occasion === 'gym') {
    if (subtype.includes('joggers') || subtype.includes('shorts')) score += 30;
  }
  if (occasion === 'beach') {
    if (subtype.includes('shorts') || subtype.includes('linen')) score += 25;
  }
  return score;
}

function pickCompatibleOuterwear(top, bottom, outerwear, occasion) {
  const topColor = top?.color;
  const scored = outerwear.map(o => ({
    item: o,
    score: getColorScore(topColor, o.color) + scoreOuterwearForOccasion(o, occasion)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item || null;
}

function scoreOuterwearForOccasion(item, occasion) {
  let score = 0;
  const subtype = (item.subtype || '').toLowerCase();
  if (occasion === 'work') {
    if (subtype.includes('blazer')) score += 30;
  }
  if (occasion === 'casual') {
    if (subtype.includes('denim') || subtype.includes('bomber') || subtype.includes('shacket')) score += 20;
  }
  if (occasion === 'party') {
    if (subtype.includes('blazer') || subtype.includes('leather')) score += 20;
  }
  return score;
}

function shouldAddOuterwear(climate, occasion) {
  if (['tropical', 'desert'].includes(climate) && occasion !== 'party' && occasion !== 'work') return false;
  if (occasion === 'gym' || occasion === 'beach') return false;
  return Math.random() > 0.4;
}

function pickFootwear(footwear, occasion, climate) {
  const scored = footwear.map(f => ({
    item: f,
    score: scoreFootwearForOccasion(f, occasion, climate)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item || null;
}

function scoreFootwearForOccasion(item, occasion, climate) {
  let score = 50;
  const subtype = (item.subtype || '').toLowerCase();
  if (occasion === 'work') {
    if (['oxford', 'derby', 'loafers', 'chelsea'].some(t => subtype.includes(t))) score += 30;
    if (subtype.includes('sneakers')) score -= 10;
  }
  if (occasion === 'casual') {
    if (subtype.includes('sneakers')) score += 25;
    if (subtype.includes('loafers')) score += 20;
  }
  if (occasion === 'gym') {
    if (subtype.includes('running') || subtype.includes('sneakers')) score += 40;
  }
  if (occasion === 'beach') {
    if (subtype.includes('sandals') || subtype.includes('slippers')) score += 40;
  }
  if (occasion === 'ethnic') {
    if (subtype.includes('sandals') || subtype.includes('loafers')) score += 20;
  }
  if (['tropical', 'desert'].includes(climate)) {
    if (subtype.includes('sandals')) score += 15;
  }
  return score;
}

function pickAccessory(accessories, occasion) {
  const scored = accessories.map(a => ({
    item: a,
    score: scoreAccessoryForOccasion(a, occasion)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item || null;
}

function scoreAccessoryForOccasion(item, occasion) {
  let score = 50;
  const subtype = (item.subtype || '').toLowerCase();
  if (occasion === 'work') {
    if (subtype.includes('watch') || subtype.includes('belt')) score += 20;
  }
  if (occasion === 'casual') {
    if (subtype.includes('cap') || subtype.includes('sunglasses')) score += 20;
  }
  if (occasion === 'party') {
    if (['watch', 'bracelet', 'necklace'].some(t => subtype.includes(t))) score += 25;
  }
  if (occasion === 'beach') {
    if (subtype.includes('sunglasses') || subtype.includes('cap')) score += 30;
  }
  return score;
}

// ---- Name & Description Generation ----

const OUTFIT_NAMES = {
  casual: ["Weekend Edit", "Off-Duty Look", "Laid-Back Luxe", "Everyday Essential", "Casual Power Move", "Easy Sunday", "Street-Ready"],
  work:   ["Office Ready", "Smart Casual Pro", "Boardroom Confident", "Power Neutral", "Executive Edge", "9-to-5 Sharp"],
  party:  ["Night Mode", "After Hours", "Statement Evening", "Party Perfect", "The Main Character", "Club Ready"],
  date:   ["Date Night Ready", "Effortless Charm", "Romantic Edit", "First Impression", "Refined Evening"],
  gym:    ["Gym Activated", "Workout Mode", "Active Fit", "Performance Ready", "Training Day"],
  ethnic: ["Heritage Look", "Festive Ready", "Cultural Statement", "Traditional Modern", "Ethnic Elegance"],
  beach:  ["Resort Mode", "Shoreside Chic", "Beach Vibes", "Island Ready", "Coastal Edit"]
};

function generateOutfitName(slots, occasion, gender) {
  const names = OUTFIT_NAMES[occasion] || OUTFIT_NAMES.casual;
  return names[Math.floor(Math.random() * names.length)];
}

function generateOutfitDesc(slots, occasion, climate, bodyType) {
  const climateNote = {
    tropical: "Light and breathable — perfect for the heat.",
    desert:   "Cool and airy — designed for hot, dry weather.",
    temperate: "Versatile layers for a comfortable climate.",
    continental: "Climate-aware layering for varied temperatures.",
    oceanic:  "Polished and adaptable for mild, overcast weather.",
    "semi-arid": "Breathable fabrics suited for warm, dry days.",
    "subtropical": "Relaxed yet stylish for humid conditions.",
    mediterranean: "Sun-ready Mediterranean style."
  }[climate] || "A polished, occasion-ready combination.";

  const bodyNote = BODY_TYPE_TIPS[bodyType]?.tops || '';
  const colorCount = [...new Set(slots.map(s => s.item?.color).filter(Boolean))].length;
  const paletteNote = colorCount <= 2 ? "Monochromatic simplicity for a sophisticated look." :
                      colorCount <= 3 ? "A harmonious colour palette with intentional contrast." :
                      "A bold mix of colours tied together by careful balance.";

  return `${paletteNote} ${climateNote}`;
}

// ---- Tips & Palette ----

function getStylingTips(occasion, bodyType, slots) {
  const occasionTips = STYLING_TIPS_DB[occasion] || STYLING_TIPS_DB.casual;
  const bodyTip = BODY_TYPE_TIPS[bodyType]?.tops;

  // Shuffle and pick 3 occasion tips
  const shuffled = [...occasionTips].sort(() => Math.random() - 0.5).slice(0, 3);
  if (bodyTip) shuffled.push(bodyTip);

  // Add 2026 trend tip
  const trendTip = "2026 Trend: Linen textures and earth tones are dominating — lean into natural, warm palettes.";
  shuffled.push(trendTip);

  return shuffled;
}

function buildPalette(slots) {
  const colors = slots
    .map(s => s.item?.color)
    .filter(Boolean)
    .map(c => {
      const match = COLORS.find(col => col.name === c);
      return match ? match.hex : '#888888';
    });

  const unique = [...new Set(colors)];

  // Describe the palette
  const neutrals = ['white', 'black', 'grey', 'beige', 'cream', 'charcoal'];
  const allColors = slots.map(s => s.item?.color).filter(Boolean);
  const nonNeutrals = allColors.filter(c => !neutrals.includes(c));

  let desc = '';
  if (nonNeutrals.length === 0) {
    desc = "A clean, neutral palette — timeless and incredibly versatile. Easy to dress up or down.";
  } else if (nonNeutrals.length === 1) {
    desc = `A neutral base anchored by ${nonNeutrals[0]}. One colour accent is the hallmark of intentional dressing.`;
  } else {
    desc = "Multiple complementary tones create a dynamic but cohesive look. Each piece carries its own colour story.";
  }

  return { hexes: unique, desc };
}

// ---- Wardrobe access helper ----

function getWardrobe(username) {
  try {
    return JSON.parse(localStorage.getItem('styleai_wardrobe_' + username)) || [];
  } catch { return []; }
}
