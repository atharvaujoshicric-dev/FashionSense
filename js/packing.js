/* ==========================================
   PACKING.JS — Occasion Packing List Generator
   ========================================== */

let _pkUser = null;

document.addEventListener('DOMContentLoaded', () => {
  _pkUser = requireAuth();
  if (!_pkUser) return;
  populateCitySelect('pack-city', _pkUser.city);
});

function generatePackingList() {
  const dest     = (document.getElementById('pack-dest')?.value || '').trim();
  const city     = document.getElementById('pack-city')?.value || _pkUser.city;
  const days     = parseInt(document.getElementById('pack-days')?.value) || 3;
  const occasion = document.getElementById('pack-occasion')?.value || 'casual';
  const wardrobe = _getWardrobe();

  const result = document.getElementById('packing-result');
  if (!result) return;

  // Generate list
  const list = _buildPackingList(wardrobe, days, occasion, city, dest);

  result.classList.remove('hidden');
  result.innerHTML = `
    <div class="pack-header">
      <h3>${days}-Day ${_cap(occasion)} Trip${dest ? ' to ' + dest : ''}</h3>
      <p>${city} · ${list.totalItems} items total</p>
    </div>

    ${list.sections.map(sec => `
      <div class="pack-section">
        <div class="pack-section-header">
          <span>${sec.emoji} ${sec.label}</span>
          <span class="pack-count">${sec.items.length} items</span>
        </div>
        <div class="pack-items">
          ${sec.items.map(item => `
            <div class="pack-item" id="pi-${item.id}" onclick="togglePackItem('${item.id}')">
              <div class="pack-check" id="pc-${item.id}">○</div>
              ${item.imageData
                ? `<img src="${item.imageData}" class="pack-thumb" />`
                : `<div class="pack-thumb-emoji">${_catEmoji(item.category)}</div>`}
              <div class="pack-item-info">
                <div class="pack-item-name">${item.color} ${item.subtype}</div>
                <div class="pack-item-note">${item._note || ''}</div>
              </div>
            </div>`).join('')}
          ${sec.missing.map(m => `
            <div class="pack-item missing">
              <div class="pack-check missing-icon">!</div>
              <div class="pack-thumb-emoji">${_catEmoji(m.category)}</div>
              <div class="pack-item-info">
                <div class="pack-item-name">${m.name}</div>
                <div class="pack-item-note missing-note">Not in wardrobe — consider buying</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`).join('')}

    ${list.essentials.length > 0 ? `
      <div class="pack-section">
        <div class="pack-section-header"><span>🪥 Grooming Essentials</span></div>
        <div class="pack-items">
          ${list.essentials.map(e => `
            <div class="pack-item" id="pe-${e}" onclick="togglePackItem('e-${e}')">
              <div class="pack-check" id="pc-e-${e}">○</div>
              <div class="pack-thumb-emoji">${e.emoji}</div>
              <div class="pack-item-info"><div class="pack-item-name">${e.name}</div></div>
            </div>`).join('')}
        </div>
      </div>` : ''}

    <div class="pack-tip">
      <h4>✦ Packing Tip</h4>
      <p>${_packTip(days, occasion)}</p>
    </div>

    <button class="btn-secondary full" style="margin-top:1rem" onclick="window.print()">🖨️ Print / Save as PDF</button>
  `;
}

function togglePackItem(id) {
  const item  = document.getElementById('pi-' + id);
  const check = document.getElementById('pc-' + id);
  if (!item || !check) return;
  const done = item.classList.toggle('packed');
  check.textContent = done ? '✓' : '○';
}

function _buildPackingList(wardrobe, days, occasion, city, dest) {
  const climate  = (typeof CITY_CLIMATE !== 'undefined' ? CITY_CLIMATE[city] : null) || 'temperate';
  const isHot    = ['tropical','desert','semi-arid'].includes(climate);
  const needsLayer = !isHot || occasion === 'work' || occasion === 'party';

  // How many of each
  const numTops     = Math.ceil(days * 1.2);  // slight buffer
  const numBottoms  = Math.ceil(days * 0.6);
  const numFootwear = occasion === 'gym' ? 1 : 2;

  const tops      = wardrobe.filter(i => i.category === 'tops').slice(0, numTops);
  const bottoms   = wardrobe.filter(i => i.category === 'bottoms').slice(0, numBottoms);
  const footwear  = wardrobe.filter(i => i.category === 'footwear').slice(0, numFootwear);
  const outer     = needsLayer ? wardrobe.filter(i => i.category === 'outerwear').slice(0, 1) : [];
  const access    = wardrobe.filter(i => i.category === 'accessories').slice(0, 2);
  const ethnic    = occasion === 'ethnic' ? wardrobe.filter(i => i.category === 'ethnic').slice(0, 2) : [];

  tops.forEach(t => { t._note = 'Outfit top'; });
  bottoms.forEach(b => { b._note = 'Mix & match'; });

  const sections = [];

  const missingTops    = tops.length < numTops    ? [{ category:'tops',    name: (numTops-tops.length)+' more top(s) needed' }] : [];
  const missingBottoms = bottoms.length < numBottoms ? [{ category:'bottoms', name: (numBottoms-bottoms.length)+' more bottom(s) needed' }] : [];
  const missingFoot    = footwear.length === 0 ? [{ category:'footwear', name: 'Footwear (none in wardrobe)' }] : [];

  if (tops.length > 0 || missingTops.length > 0)
    sections.push({ emoji:'👕', label:'Tops', items: tops, missing: missingTops });
  if (bottoms.length > 0 || missingBottoms.length > 0)
    sections.push({ emoji:'👖', label:'Bottoms', items: bottoms, missing: missingBottoms });
  if (ethnic.length > 0)
    sections.push({ emoji:'🥻', label:'Ethnic / Festive', items: ethnic, missing: [] });
  if (footwear.length > 0 || missingFoot.length > 0)
    sections.push({ emoji:'👟', label:'Footwear', items: footwear, missing: missingFoot });
  if (outer.length > 0)
    sections.push({ emoji:'🧥', label:'Outerwear / Layer', items: outer, missing: [] });
  if (access.length > 0)
    sections.push({ emoji:'⌚', label:'Accessories', items: access, missing: [] });

  const essentials = [
    { emoji:'🪥', name:'Toothbrush & toothpaste' },
    { emoji:'🧴', name:'Moisturiser & SPF' },
    { emoji:'💊', name:'Medications / vitamins' },
    { emoji:'🔌', name:'Phone charger' },
    { emoji:'👙', name:'Undergarments (' + days + ' pairs)' },
  ];

  const totalItems = tops.length + bottoms.length + ethnic.length + footwear.length + outer.length + access.length;
  return { sections, essentials, totalItems };
}

function _packTip(days, occasion) {
  const tips = {
    casual:  'Roll clothes instead of folding — saves space and reduces creasing.',
    work:    'Pack one versatile blazer that works across multiple outfits.',
    party:   'Bring one statement piece as your party anchor, build simply around it.',
    ethnic:  'Iron ethnic wear before packing — creases are hard to remove on the road.',
    gym:     'Compression wear packs smallest. Bring a separate bag for sweaty clothes.',
    beach:   'Pack light, quick-dry fabrics. One pair of versatile sandals covers most occasions.',
    date:    'Pack your most confident outfit. How you feel in it matters more than how it looks.'
  };
  return tips[occasion] || `For ${days} days, aim for ${Math.ceil(days*0.6)} bottoms and ${Math.ceil(days*1.2)} tops — mix and match to maximise combinations.`;
}

function _cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function _catEmoji(c) {
  return {tops:'👕',bottoms:'👖',outerwear:'🧥',footwear:'👟',accessories:'⌚',ethnic:'🥻'}[c]||'👗';
}
function _getWardrobe() {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + _pkUser.username)) || []; }
  catch { return []; }
}
