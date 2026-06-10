/* ==========================================
   ANALYSIS.JS — Style Score & Wardrobe Intelligence
   ========================================== */

let _aUser = null;

document.addEventListener('DOMContentLoaded', () => {
  _aUser = requireAuth();
  if (!_aUser) return;
  initAvatar(_aUser);
  runAnalysis();
});

function runAnalysis() {
  const wardrobe = _getWardrobe();
  const gender   = _aUser.gender || 'male';

  _renderScoreCard(wardrobe, gender);
  _renderCategoryBreakdown(wardrobe, gender);
  _renderColorAnalysis(wardrobe);
  _renderOccasionCoverage(wardrobe, gender);
  _renderColorGaps(wardrobe);
  _renderWhatGoesWithThis(wardrobe);
}

// ── Score ─────────────────────────────────────────────────────────────────────

function _renderScoreCard(wardrobe, gender) {
  const score = _calcScore(wardrobe, gender);
  const ring  = document.getElementById('score-ring-fill');
  const num   = document.getElementById('score-number');
  const label = document.getElementById('score-label');
  const tips  = document.getElementById('score-tips');
  if (!ring) return;

  const pct       = score / 100;
  const circum    = 2 * Math.PI * 45; // r=45
  const dashOffset= circum * (1 - pct);
  ring.style.strokeDasharray  = circum;
  ring.style.strokeDashoffset = dashOffset;
  ring.style.stroke = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--accent)' : 'var(--red)';

  num.textContent  = score;
  label.textContent = score >= 80 ? 'Style Pro ✦' : score >= 60 ? 'Getting There' : score >= 40 ? 'Building Up' : 'Just Starting';

  // Improvement tips
  const scoreTips = _getScoreTips(wardrobe, gender);
  tips.innerHTML  = scoreTips.map(t => `<li>${t}</li>`).join('');
}

function _calcScore(wardrobe, gender) {
  if (wardrobe.length === 0) return 0;
  let score = 0;

  // Quantity (max 20)
  score += Math.min(20, wardrobe.length * 2);

  // Category coverage (max 25) — 5 pts per covered category
  const cats    = new Set(wardrobe.map(i => i.category));
  const allCats = ['tops','bottoms','footwear','outerwear','accessories'];
  score += allCats.filter(c => cats.has(c)).length * 5;

  // Color variety (max 20)
  const colors  = new Set(wardrobe.map(i => i.color));
  score += Math.min(20, colors.size * 3);

  // Occasion coverage (max 20)
  const canDo   = _getOccasionCoverage(wardrobe).filter(o => o.covered).length;
  score += Math.round(canDo / 7 * 20);

  // Photo completeness (max 15)
  const withPhoto = wardrobe.filter(i => i.imageData).length;
  score += Math.round((withPhoto / wardrobe.length) * 15);

  return Math.min(100, Math.round(score));
}

function _getScoreTips(wardrobe, gender) {
  const tips = [];
  const cats = new Set(wardrobe.map(i => i.category));

  if (!cats.has('footwear'))    tips.push('Add footwear — it\'s missing from your wardrobe');
  if (!cats.has('outerwear'))   tips.push('A blazer or jacket will unlock many more outfit combinations');
  if (!cats.has('accessories')) tips.push('Add accessories (watch, belt) for a polished finish');

  const colors = new Set(wardrobe.map(i => i.color));
  if (colors.size < 4)          tips.push('Add more color variety — aim for at least 4-5 different colors');

  const withPhoto = wardrobe.filter(i => i.imageData).length;
  if (withPhoto < wardrobe.length * 0.5) tips.push('Add photos to your wardrobe items for better outfit matching');

  const tops    = wardrobe.filter(i => i.category === 'tops').length;
  const bottoms = wardrobe.filter(i => i.category === 'bottoms').length;
  if (tops > 0 && bottoms === 0) tips.push('You need bottoms! Jeans, chinos or trousers are essential.');
  if (bottoms > tops * 2)        tips.push('Balance your wardrobe — you have more bottoms than tops');

  if (tips.length === 0) tips.push('Great wardrobe! Keep adding new 2026 trend pieces to stay fresh.');
  return tips.slice(0, 4);
}

// ── Category breakdown ────────────────────────────────────────────────────────

function _renderCategoryBreakdown(wardrobe, gender) {
  const el = document.getElementById('category-breakdown');
  if (!el || wardrobe.length === 0) { if (el) el.innerHTML = '<p class="empty-note">No items yet</p>'; return; }

  const catData = {
    tops:        { emoji:'👕', ideal: 5 },
    bottoms:     { emoji:'👖', ideal: 4 },
    footwear:    { emoji:'👟', ideal: 3 },
    outerwear:   { emoji:'🧥', ideal: 2 },
    accessories: { emoji:'⌚', ideal: 3 },
    ethnic:      { emoji:'🥻', ideal: 2 },
  };

  const counts = {};
  wardrobe.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });

  el.innerHTML = Object.entries(catData).map(([cat, info]) => {
    const count   = counts[cat] || 0;
    const pct     = Math.min(100, Math.round(count / info.ideal * 100));
    const status  = count === 0 ? 'missing' : count < info.ideal ? 'low' : 'good';
    const color   = status === 'good' ? 'var(--green)' : status === 'low' ? 'var(--accent)' : 'var(--red)';

    return `
      <div class="cat-bar-item">
        <div class="cat-bar-label">
          <span>${info.emoji} ${cat}</span>
          <span style="color:${color}">${count} / ${info.ideal} ideal</span>
        </div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}

// ── Color analysis ────────────────────────────────────────────────────────────

function _renderColorAnalysis(wardrobe) {
  const el = document.getElementById('color-wheel');
  if (!el) return;

  const counts = {};
  wardrobe.forEach(i => { if (i.color) counts[i.color] = (counts[i.color] || 0) + 1; });

  if (Object.keys(counts).length === 0) { el.innerHTML = '<p class="empty-note">No items yet</p>'; return; }

  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  const total  = wardrobe.length;

  el.innerHTML = sorted.map(([color, count]) => {
    const hex  = (typeof COLORS !== 'undefined' ? COLORS.find(c => c.name === color) : null)?.hex || '#888';
    const pct  = Math.round(count / total * 100);
    return `
      <div class="color-bar-item">
        <div class="color-bar-swatch" style="background:${hex}"></div>
        <div class="color-bar-track">
          <div class="color-bar-fill" style="width:${pct}%;background:${hex}"></div>
        </div>
        <span class="color-bar-label">${color}</span>
        <span class="color-bar-count">${count}</span>
      </div>`;
  }).join('');
}

// ── Occasion coverage ─────────────────────────────────────────────────────────

function _renderOccasionCoverage(wardrobe, gender) {
  const el       = document.getElementById('occasion-coverage');
  if (!el) return;
  const coverage = _getOccasionCoverage(wardrobe);

  el.innerHTML = coverage.map(o => `
    <div class="occ-cover-item ${o.covered ? 'covered' : 'missing'}">
      <span class="occ-cover-icon">${o.emoji}</span>
      <span class="occ-cover-name">${o.name}</span>
      <span class="occ-cover-status">${o.covered ? '✓' : '✗'}</span>
    </div>`
  ).join('');
}

function _getOccasionCoverage(wardrobe) {
  const cats = new Set(wardrobe.map(i => i.category));
  const has  = c => cats.has(c);
  return [
    { name:'Casual',   emoji:'☕', covered: has('tops') && has('bottoms') },
    { name:'Work',     emoji:'💼', covered: has('tops') && has('bottoms') && (has('outerwear') || has('footwear')) },
    { name:'Party',    emoji:'🎉', covered: has('tops') && has('bottoms') },
    { name:'Date',     emoji:'❤️', covered: has('tops') && has('bottoms') && has('footwear') },
    { name:'Gym',      emoji:'💪', covered: has('tops') && has('bottoms') },
    { name:'Ethnic',   emoji:'🎊', covered: has('ethnic') },
    { name:'Beach',    emoji:'🏖️', covered: has('tops') && has('bottoms') && has('footwear') },
  ];
}

// ── Color gap finder ──────────────────────────────────────────────────────────

function _renderColorGaps(wardrobe) {
  const el = document.getElementById('color-gaps');
  if (!el) return;

  if (!wardrobe.length) { el.innerHTML = '<p class="empty-note">Add clothes to see color insights</p>'; return; }

  const ownColors = new Set(wardrobe.map(i => i.color));
  const gaps      = [];

  // Check which neutral/key colors are missing and would unlock most combos
  const keyColors = ['white','black','navy','grey','beige','olive','brown','charcoal'];
  keyColors.forEach(c => {
    if (!ownColors.has(c)) {
      const unlocks = wardrobe.filter(item => {
        const pairs = (typeof COLOR_PAIRS !== 'undefined' ? COLOR_PAIRS[item.color] : null) || [];
        return pairs.includes(c);
      }).length;
      if (unlocks > 0) gaps.push({ color: c, unlocks });
    }
  });

  gaps.sort((a,b) => b.unlocks - a.unlocks);

  if (gaps.length === 0) {
    el.innerHTML = '<p style="color:var(--green);font-size:0.9rem">✓ Great color coverage! Your wardrobe pairs well across most combinations.</p>';
    return;
  }

  el.innerHTML = `
    <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.75rem">Adding these colors would unlock the most new outfit combinations:</p>
    ${gaps.slice(0,4).map(g => {
      const hex = (typeof COLORS !== 'undefined' ? COLORS.find(c => c.name === g.color) : null)?.hex || '#888';
      return `
        <div class="gap-item">
          <div class="gap-swatch" style="background:${hex}"></div>
          <div class="gap-info">
            <span class="gap-name">${g.color}</span>
            <span class="gap-unlocks">unlocks ${g.unlocks} new combo${g.unlocks>1?'s':''}</span>
          </div>
        </div>`;
    }).join('')}`;
}

// ── What goes with this ───────────────────────────────────────────────────────

function _renderWhatGoesWithThis(wardrobe) {
  const sel = document.getElementById('wgwt-select');
  const out = document.getElementById('wgwt-results');
  if (!sel || !out) return;

  sel.innerHTML = '<option value="">Pick an item…</option>' +
    wardrobe.map((item, i) =>
      `<option value="${i}">${item.color} ${item.subtype}</option>`
    ).join('');

  sel.onchange = () => {
    const idx  = parseInt(sel.value);
    if (isNaN(idx)) { out.innerHTML = ''; return; }
    const item = wardrobe[idx];
    _showPairs(item, wardrobe, out);
  };
}

function _showPairs(item, wardrobe, container) {
  const pairs    = (typeof COLOR_PAIRS !== 'undefined' ? COLOR_PAIRS[item.color] : null) || [];
  const matching = wardrobe.filter(w =>
    w.id !== item.id && (pairs.includes(w.color) || w.color === item.color)
  );

  if (matching.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:0.5rem">No matching items in your wardrobe yet.</p>';
    return;
  }

  // Group by category
  const bycat = {};
  matching.forEach(w => { if (!bycat[w.category]) bycat[w.category] = []; bycat[w.category].push(w); });

  container.innerHTML = Object.entries(bycat).map(([cat, items]) => `
    <div class="wgwt-group">
      <div class="wgwt-group-label">${_catEmoji(cat)} ${cat}</div>
      <div class="wgwt-items">
        ${items.map(w => `
          <div class="wgwt-item">
            ${w.imageData
              ? `<img src="${w.imageData}" class="wgwt-thumb" />`
              : `<div class="wgwt-thumb-emoji">${_catEmoji(w.category)}</div>`}
            <span class="wgwt-name">${w.color} ${w.subtype}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _catEmoji(cat) {
  return {tops:'👕',bottoms:'👖',outerwear:'🧥',footwear:'👟',accessories:'⌚',ethnic:'🥻'}[cat]||'👗';
}

function _getWardrobe() {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + _aUser.username)) || []; }
  catch { return []; }
}
