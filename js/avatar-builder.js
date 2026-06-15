/* ==========================================
   AVATAR-BUILDER.JS
   User-customisable cartoon avatar
   ========================================== */

const AB = {
  user: null,
  // Current selections
  skinTone:  '#D4956A',
  hairColor: '#3D2A1A',
  eyeColor:  '#4A3020',
  hairStyle: 'short',   // short | medium | long | curly | bun
  topColor:  '#4A7AB5',
  bottomColor:'#3A5A8A',
  shoeColor: '#4A3A2A',
  accentColor:'#E8A0B0',
  hasGlasses: false,
  hasBelt:    false,
  hasWatch:   false,
};

const SKIN_TONES = [
  { label:'Porcelain', hex:'#FDDBB4' },
  { label:'Fair',      hex:'#F1C27D' },
  { label:'Medium',    hex:'#E8AC6A' },
  { label:'Tan',       hex:'#C68642' },
  { label:'Brown',     hex:'#8D5524' },
  { label:'Deep',      hex:'#4A2912' },
];

const HAIR_COLORS = [
  { label:'Jet Black',  hex:'#1A0A00' },
  { label:'Dark Brown', hex:'#3D2314' },
  { label:'Brown',      hex:'#6B3A2A' },
  { label:'Auburn',     hex:'#922B21' },
  { label:'Blonde',     hex:'#D4A843' },
  { label:'Platinum',   hex:'#EDE0C8' },
  { label:'Silver',     hex:'#9B9B9B' },
  { label:'Red',        hex:'#C0392B' },
  { label:'Blue',       hex:'#2E4A9E' },
  { label:'Purple',     hex:'#6C3483' },
];

const HAIR_STYLES = [
  { val:'short',  label:'Short',  emoji:'💇' },
  { val:'medium', label:'Medium', emoji:'🧑' },
  { val:'long',   label:'Long',   emoji:'👱' },
  { val:'curly',  label:'Curly',  emoji:'🥳' },
  { val:'bun',    label:'Bun',    emoji:'🙆' },
];

const OUTFIT_COLORS = [
  '#FFFFFF','#1A1A1A','#3A5A8A','#8A3A3A','#3A8A5A','#8A6A3A',
  '#4A7AB5','#B54A4A','#4AB58A','#B5A04A','#7A4AB5','#B54A8A',
  '#E8A0B0','#A0C4E8','#A0E8C4','#E8C4A0','#C4A0E8','#E8E0A0',
];

document.addEventListener('DOMContentLoaded', () => {
  AB.user = requireAuth();
  if (!AB.user) return;
  initPageAvatar(AB.user);

  // Load saved avatar config
  const saved = _loadABConfig();
  if (saved) Object.assign(AB, saved);

  // Set defaults from user profile
  if (!saved) {
    const g = AB.user.gender || 'male';
    AB.hairStyle = g === 'female' ? 'long' : 'short';
    AB.topColor  = g === 'female' ? '#E8A0B0' : '#4A7AB5';
  }

  _buildUI();
  _preview();
});

// ── Build UI ──────────────────────────────────────────────────────────────────

function _buildUI() {
  _buildSkinSection();
  _buildHairColorSection();
  _buildHairStyleSection();
  _buildOutfitSection();
  _buildAccessorySection();
}

function _buildSkinSection() {
  const el = document.getElementById('ab-skin-tones');
  if (!el) return;
  el.innerHTML = SKIN_TONES.map(t => `
    <div class="ab-swatch ${AB.skinTone===t.hex?'selected':''}"
         style="background:${t.hex}" title="${t.label}"
         onclick="setSkin('${t.hex}')"></div>`).join('');
}

function _buildHairColorSection() {
  const el = document.getElementById('ab-hair-colors');
  if (!el) return;
  el.innerHTML = HAIR_COLORS.map(t => `
    <div class="ab-swatch ${AB.hairColor===t.hex?'selected':''}"
         style="background:${t.hex}" title="${t.label}"
         onclick="setHair('${t.hex}')"></div>`).join('');
}

function _buildHairStyleSection() {
  const el = document.getElementById('ab-hair-styles');
  if (!el) return;
  el.innerHTML = HAIR_STYLES.map(s => `
    <button type="button" class="ab-style-btn ${AB.hairStyle===s.val?'active':''}"
            onclick="setHairStyle('${s.val}')">
      <span>${s.emoji}</span>
      <span>${s.label}</span>
    </button>`).join('');
}

function _buildOutfitSection() {
  const top    = document.getElementById('ab-top-colors');
  const bottom = document.getElementById('ab-bottom-colors');
  const shoes  = document.getElementById('ab-shoe-colors');

  [{ el:top, key:'topColor' }, { el:bottom, key:'bottomColor' }, { el:shoes, key:'shoeColor' }]
    .forEach(({ el, key }) => {
      if (!el) return;
      el.innerHTML = OUTFIT_COLORS.map(hex => `
        <div class="ab-swatch ab-swatch-sm ${AB[key]===hex?'selected':''}"
             style="background:${hex};border-color:${hex==='#FFFFFF'?'#ccc':hex}"
             onclick="setOutfitColor('${key}','${hex}')"></div>`).join('');
    });
}

function _buildAccessorySection() {
  ['glasses','belt','watch'].forEach(acc => {
    const el = document.getElementById('ab-acc-'+acc);
    if (!el) return;
    const key = 'has' + acc.charAt(0).toUpperCase() + acc.slice(1);
    el.classList.toggle('active', AB[key]);
    el.onclick = () => {
      AB[key] = !AB[key];
      el.classList.toggle('active', AB[key]);
      _preview();
    };
  });
}

// ── Setters ───────────────────────────────────────────────────────────────────

function setSkin(hex) {
  AB.skinTone = hex;
  _buildSkinSection();
  // Also update eye color based on skin
  const bright = parseInt(hex.slice(1,3),16);
  AB.eyeColor = bright > 0xB0 ? '#5A7A8A' : bright > 0x80 ? '#6B4226' : '#3D2314';
  _preview();
}

function setHair(hex) {
  AB.hairColor = hex;
  _buildHairColorSection();
  _preview();
}

function setHairStyle(val) {
  AB.hairStyle = val;
  _buildHairStyleSection();
  _preview();
}

function setOutfitColor(key, hex) {
  AB[key] = hex;
  _buildOutfitSection();
  _preview();
}

// ── Preview ───────────────────────────────────────────────────────────────────

function _preview() {
  const stage = document.getElementById('ab-preview-stage');
  if (!stage) return;

  const colors = {
    skin:       AB.skinTone,
    hair:       AB.hairColor,
    skinDark:   _darkenHex(AB.skinTone, 0.80),
    skinLight:  _lightenHex(AB.skinTone, 1.15),
    eyeColor:   AB.eyeColor,
  };

  const outfit = {
    top:       { color: _hexToName(AB.topColor),    subtype:'top'    },
    bottom:    { color: _hexToName(AB.bottomColor), subtype:'bottom' },
    footwear:  { color: _hexToName(AB.shoeColor),   subtype:'shoe'   },
    accessory: {
      subtype: [
        AB.hasWatch   ? 'watch'  : '',
        AB.hasBelt    ? 'belt'   : '',
        AB.hasGlasses ? 'glasses': '',
      ].filter(Boolean).join(' ')
    }
  };

  // Override color lookup in generateAvatarSVG for direct hex
  const svg = _generateAvatarDirect(colors, AB.user?.gender||'male',
    AB.user?.bodyType||'average', outfit, AB);

  stage.innerHTML = svg;
}

// ── Direct SVG with hex colors ────────────────────────────────────────────────

function _generateAvatarDirect(c, gender, bodyType, outfit, ab) {
  const isFemale = gender === 'female';
  const props = {
    slim:{sw:29,hw:26,ww:21,lw:9}, athletic:{sw:35,hw:29,ww:25,lw:11},
    average:{sw:32,hw:30,ww:26,lw:10}, broad:{sw:39,hw:33,ww:30,lw:12},
    plus:{sw:38,hw:39,ww:35,lw:13},
  }[bodyType] || {sw:32,hw:30,ww:26,lw:10};
  if (isFemale) { props.hw += 4; props.ww -= 2; }

  const cx=100, {sw,hw,ww,lw} = props;
  const topHex    = ab.topColor;
  const bottomHex = ab.bottomColor;
  const shoeHex   = ab.shoeColor;
  const outerHex  = null;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 340" style="width:100%;height:100%">
  <defs>
    <style>
      .ab-body{animation:breathe 3s ease-in-out infinite;transform-origin:100px 200px}
      .ab-head{animation:headbob 3s ease-in-out infinite;transform-origin:100px 90px}
      @keyframes breathe{0%,100%{transform:scaleY(1) translateY(0)}50%{transform:scaleY(1.012) translateY(-1.5px)}}
      @keyframes headbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
    </style>
    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.skinLight}"/>
      <stop offset="100%" stop-color="${c.skinDark}"/>
    </linearGradient>
    <radialGradient id="shad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.15)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>

  <ellipse cx="100" cy="332" rx="40" ry="8" fill="url(#shad)"/>

  <g class="ab-body">
    ${_svgLegs(cx,lw,false,false,bottomHex,shoeHex,c)}
    ${_svgTorso(cx,sw,hw,ww,topHex,bottomHex,outerHex,isFemale)}
    ${_svgArms(cx,sw,c,topHex,outerHex)}
    ${ab.hasBelt?`<rect x="${cx-ww-2}" y="200" width="${ww*2+4}" height="7" rx="3" fill="#2A1A0A" opacity="0.9"/>
      <rect x="${cx-5}" y="199" width="10" height="9" rx="2" fill="#C9A030"/>`:''}
    ${ab.hasWatch?`<rect x="${cx+sw+6}" y="174" width="15" height="10" rx="3" fill="#1a1a1a"/>
      <rect x="${cx+sw+8}" y="176" width="11" height="6" rx="2" fill="#2A8AF0"/>`:''}
  </g>

  <g class="ab-head">
    ${_svgHead(cx, c, isFemale, gender, ab)}
  </g>
</svg>`;
}

function _svgLegs(cx,lw,isShorts,isDress,bHex,sHex,c) {
  return `
  <path d="M${cx-lw-4} 205 L${cx-lw-4} 308 Q${cx-lw} 314 ${cx-2} 314 L${cx-2} 205Z" fill="${bHex}" opacity="0.93"/>
  <path d="M${cx+2} 205 L${cx+2} 314 Q${cx+lw} 314 ${cx+lw+4} 308 L${cx+lw+4} 205Z" fill="${bHex}" opacity="0.93"/>
  <line x1="${cx-2}" y1="210" x2="${cx-2}" y2="305" stroke="rgba(0,0,0,0.07)" stroke-width="2"/>
  <rect x="${cx-lw-12}" y="308" width="${lw*2+4}" height="13" rx="6" fill="${sHex}" opacity="0.93"/>
  <rect x="${cx+2}" y="308" width="${lw*2+4}" height="13" rx="6" fill="${sHex}" opacity="0.93"/>
  <rect x="${cx-lw-12}" y="308" width="${lw+2}" height="8" rx="4" fill="rgba(255,255,255,0.14)"/>
  <rect x="${cx+2}" y="308" width="${lw+2}" height="8" rx="4" fill="rgba(255,255,255,0.14)"/>`;
}

function _svgTorso(cx,sw,hw,ww,tHex,bHex,oHex,isFemale) {
  return `
  <path d="M${cx-ww} 200 L${cx-hw} 212 L${cx+hw} 212 L${cx+ww} 200Z" fill="${bHex}" opacity="0.93"/>
  <path d="M${cx-sw} 128 L${cx-ww} 200 L${cx+ww} 200 L${cx+sw} 128Z" fill="${tHex}" opacity="0.93"/>
  ${isFemale
    ? `<path d="M${cx-12} 128 Q${cx} 142 ${cx+12} 128" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>`
    : `<path d="M${cx-10} 128 L${cx-6} 138 L${cx+6} 138 L${cx+10} 128" fill="rgba(0,0,0,0.1)"/>
       <line x1="${cx}" y1="140" x2="${cx}" y2="195" stroke="rgba(0,0,0,0.07)" stroke-width="1.5"/>
       <rect x="${cx-14}" y="148" width="9" height="7" rx="2" fill="rgba(0,0,0,0.09)"/>`}
  ${oHex ? `
  <path d="M${cx-sw} 128 L${cx-sw+4} 200 L${cx-8} 200 L${cx-8} 136Z" fill="${oHex}" opacity="0.9"/>
  <path d="M${cx+sw} 128 L${cx+sw-4} 200 L${cx+8} 200 L${cx+8} 136Z" fill="${oHex}" opacity="0.9"/>
  <path d="M${cx-8} 136 L${cx-sw+4} 128 L${cx-sw+12} 148Z" fill="rgba(255,255,255,0.12)"/>
  <path d="M${cx+8} 136 L${cx+sw-4} 128 L${cx+sw-12} 148Z" fill="rgba(255,255,255,0.12)"/>` : ''}`;
}

function _svgArms(cx,sw,c,tHex,oHex) {
  const aHex = oHex || tHex;
  const aw   = sw > 34 ? 19 : 16;
  return `
  <path d="M${cx-sw} 135 Q${cx-sw-18} 158 ${cx-sw-12} 185" fill="none" stroke="${aHex}" stroke-width="${aw}" stroke-linecap="round" opacity="0.93"/>
  <path d="M${cx-sw-12} 185 Q${cx-sw-8} 205 ${cx-sw-4} 210" fill="none" stroke="${c.skin}" stroke-width="13" stroke-linecap="round"/>
  <ellipse cx="${cx-sw-3}" cy="212" rx="8.5" ry="6.5" fill="${c.skin}"/>
  <path d="M${cx+sw} 135 Q${cx+sw+18} 158 ${cx+sw+12} 185" fill="none" stroke="${aHex}" stroke-width="${aw}" stroke-linecap="round" opacity="0.93"/>
  <path d="M${cx+sw+12} 185 Q${cx+sw+8} 205 ${cx+sw+4} 210" fill="none" stroke="${c.skin}" stroke-width="13" stroke-linecap="round"/>
  <ellipse cx="${cx+sw+3}" cy="212" rx="8.5" ry="6.5" fill="${c.skin}"/>`;
}

function _svgHead(cx, c, isFemale, gender, ab) {
  const hy = 80;
  const hc = ab.hairColor;

  const hair = {
    short: `<ellipse cx="${cx}" cy="${hy-22}" rx="31" ry="22" fill="${hc}"/>
      <path d="M${cx-30} ${hy-8} Q${cx-26} ${hy-4} ${cx-18} ${hy-2}" fill="none" stroke="${hc}" stroke-width="8"/>
      <path d="M${cx+30} ${hy-8} Q${cx+26} ${hy-4} ${cx+18} ${hy-2}" fill="none" stroke="${hc}" stroke-width="8"/>`,

    medium: `<ellipse cx="${cx}" cy="${hy-22}" rx="33" ry="24" fill="${hc}"/>
      <path d="M${cx-32} ${hy} Q${cx-40} ${hy+28} ${cx-34} ${hy+52}" fill="none" stroke="${hc}" stroke-width="11" stroke-linecap="round"/>
      <path d="M${cx+32} ${hy} Q${cx+40} ${hy+28} ${cx+34} ${hy+52}" fill="none" stroke="${hc}" stroke-width="11" stroke-linecap="round"/>`,

    long: `<ellipse cx="${cx}" cy="${hy-22}" rx="34" ry="26" fill="${hc}"/>
      <path d="M${cx-33} ${hy-2} Q${cx-44} ${hy+35} ${cx-40} ${hy+70}" fill="none" stroke="${hc}" stroke-width="14" stroke-linecap="round"/>
      <path d="M${cx+33} ${hy-2} Q${cx+44} ${hy+35} ${cx+40} ${hy+70}" fill="none" stroke="${hc}" stroke-width="14" stroke-linecap="round"/>`,

    curly: `<ellipse cx="${cx}" cy="${hy-24}" rx="35" ry="26" fill="${hc}"/>
      <circle cx="${cx-28}" cy="${hy-28}" r="10" fill="${hc}"/>
      <circle cx="${cx+28}" cy="${hy-28}" r="10" fill="${hc}"/>
      <circle cx="${cx-16}" cy="${hy-34}" r="9"  fill="${hc}"/>
      <circle cx="${cx+16}" cy="${hy-34}" r="9"  fill="${hc}"/>
      <circle cx="${cx}"    cy="${hy-36}" r="9"  fill="${hc}"/>`,

    bun: `<ellipse cx="${cx}" cy="${hy-22}" rx="31" ry="22" fill="${hc}"/>
      <circle cx="${cx}" cy="${hy-50}" r="14" fill="${hc}"/>
      <ellipse cx="${cx}" cy="${hy-37}" rx="8" ry="5" fill="${hc}"/>`,
  }[ab.hairStyle] || '';

  const glasses = ab.hasGlasses ? `
    <rect x="${cx-22}" y="${hy-6}" width="18" height="13" rx="6" fill="none" stroke="rgba(50,50,50,0.8)" stroke-width="2.5"/>
    <rect x="${cx+4}"  y="${hy-6}" width="18" height="13" rx="6" fill="none" stroke="rgba(50,50,50,0.8)" stroke-width="2.5"/>
    <line x1="${cx-4}" y1="${hy}"  x2="${cx+4}" y2="${hy}" stroke="rgba(50,50,50,0.8)" stroke-width="2"/>
    <line x1="${cx-40}" y1="${hy}" x2="${cx-22}" y2="${hy}" stroke="rgba(50,50,50,0.7)" stroke-width="1.8"/>
    <line x1="${cx+22}" y1="${hy}" x2="${cx+40}" y2="${hy}" stroke="rgba(50,50,50,0.7)" stroke-width="1.8"/>` : '';

  return `
  ${hair}
  <rect x="${cx-10}" y="${hy+32}" width="20" height="18" rx="6" fill="url(#sg)"/>
  <ellipse cx="${cx}" cy="${hy}" rx="30" ry="34" fill="url(#sg)"/>
  <ellipse cx="${cx-19}" cy="${hy+8}" rx="7.5" ry="5.5" fill="rgba(220,110,90,0.2)"/>
  <ellipse cx="${cx+19}" cy="${hy+8}" rx="7.5" ry="5.5" fill="rgba(220,110,90,0.2)"/>
  <ellipse cx="${cx-11}" cy="${hy}" rx="8" ry="6.5" fill="white"/>
  <ellipse cx="${cx+11}" cy="${hy}" rx="8" ry="6.5" fill="white"/>
  <circle  cx="${cx-11}" cy="${hy}" r="4.5" fill="${ab.eyeColor}"/>
  <circle  cx="${cx+11}" cy="${hy}" r="4.5" fill="${ab.eyeColor}"/>
  <circle  cx="${cx-11}" cy="${hy}" r="2.2" fill="#111"/>
  <circle  cx="${cx+11}" cy="${hy}" r="2.2" fill="#111"/>
  <circle  cx="${cx-9.5}" cy="${hy-1.5}" r="1.2" fill="white"/>
  <circle  cx="${cx+12.5}" cy="${hy-1.5}" r="1.2" fill="white"/>
  <path d="M${cx-19} ${hy-2} Q${cx-11} ${hy-8} ${cx-3} ${hy-2}" fill="none" stroke="${hc}" stroke-width="1.8" opacity="0.7"/>
  <path d="M${cx+3}  ${hy-2} Q${cx+11} ${hy-8} ${cx+19} ${hy-2}" fill="none" stroke="${hc}" stroke-width="1.8" opacity="0.7"/>
  <path d="M${cx-19} ${hy-13} Q${cx-11} ${hy-17} ${cx-3} ${hy-13}" fill="none" stroke="${hc}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
  <path d="M${cx+3}  ${hy-13} Q${cx+11} ${hy-17} ${cx+19} ${hy-13}" fill="none" stroke="${hc}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
  <path d="M${cx-4} ${hy+10} Q${cx} ${hy+17} ${cx+4} ${hy+10}" fill="none" stroke="${c.skinDark}" stroke-width="1.8" opacity="0.55"/>
  <path d="M${cx-10} ${hy+21} Q${cx} ${hy+29} ${cx+10} ${hy+21}" fill="none" stroke="${c.skinDark}" stroke-width="2.2" stroke-linecap="round" opacity="0.7"/>
  ${glasses}
  ${isFemale ? `<circle cx="${cx-30}" cy="${hy+2}" r="4" fill="${c.skin}"/>
    <circle cx="${cx-28}" cy="${hy+9}" r="2.5" fill="#E0C060" opacity="0.9"/>
    <circle cx="${cx+30}" cy="${hy+2}" r="4" fill="${c.skin}"/>
    <circle cx="${cx+28}" cy="${hy+9}" r="2.5" fill="#E0C060" opacity="0.9"/>` : ''}`;
}

// ── Save & Apply ──────────────────────────────────────────────────────────────

function saveAvatar() {
  const config = {
    skinTone: AB.skinTone, hairColor: AB.hairColor, eyeColor: AB.eyeColor,
    hairStyle: AB.hairStyle, topColor: AB.topColor, bottomColor: AB.bottomColor,
    shoeColor: AB.shoeColor, hasGlasses: AB.hasGlasses, hasBelt: AB.hasBelt, hasWatch: AB.hasWatch,
  };
  localStorage.setItem('styleai_avatar_' + AB.user.username, JSON.stringify(config));
  updateCurrentUser({ avatarConfig: config });
  showToast('Avatar saved ✦');
  setTimeout(() => window.location.href = 'profile.html', 800);
}

function _loadABConfig() {
  try {
    const raw = localStorage.getItem('styleai_avatar_' + AB.user?.username);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function _darkenHex(hex, f) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;
}
function _lightenHex(hex, f) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(255,Math.round(r*f))},${Math.min(255,Math.round(g*f))},${Math.min(255,Math.round(b*f))})`;
}
function _hexToName(hex) {
  // Try to map to named color, fallback to hex itself
  if (typeof COLORS === 'undefined') return hex;
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  let best='', bestD=Infinity;
  COLORS.forEach(c => {
    const ch=c.hex, cr=parseInt(ch.slice(1,3),16), cg=parseInt(ch.slice(3,5),16), cb=parseInt(ch.slice(5,7),16);
    const d=Math.sqrt((r-cr)**2+(g-cg)**2+(b-cb)**2);
    if (d<bestD) { bestD=d; best=c.name; }
  });
  return best || hex;
}

// ── Override avatar.js renderAvatarWithOutfit to use saved config ─────────────

const _origRenderAvatarWithOutfit = window.renderAvatarWithOutfit;
window.renderAvatarWithOutfit = async function(containerEl, user, slots) {
  const config = _loadConfigForUser(user);
  if (!config) { return _origRenderAvatarWithOutfit(containerEl, user, slots); }

  const outfit = {};
  if (slots) slots.forEach(s => {
    if (s.role==='top')       outfit.top      = s.item;
    if (s.role==='bottom')    outfit.bottom   = s.item;
    if (s.role==='outerwear') outfit.outerwear= s.item;
    if (s.role==='footwear')  outfit.footwear = s.item;
    if (s.role==='accessory') outfit.accessory= s.item;
  });

  // Use saved config colors but override clothing with actual outfit
  const abCopy = Object.assign({}, config, {
    topColor:    outfit.top?.color     ? (_getHex(outfit.top.color)    || config.topColor)    : config.topColor,
    bottomColor: outfit.bottom?.color  ? (_getHex(outfit.bottom.color) || config.bottomColor) : config.bottomColor,
    shoeColor:   outfit.footwear?.color? (_getHex(outfit.footwear.color)||config.shoeColor)   : config.shoeColor,
    user,
  });

  const c = {
    skin:      abCopy.skinTone,
    hair:      abCopy.hairColor,
    skinDark:  _darkenHex(abCopy.skinTone, 0.80),
    skinLight: _lightenHex(abCopy.skinTone, 1.15),
    eyeColor:  abCopy.eyeColor,
  };

  containerEl.innerHTML = _generateAvatarDirect(c, user.gender||'male', user.bodyType||'average', outfit, abCopy);
};

function _loadConfigForUser(user) {
  try {
    const raw = localStorage.getItem('styleai_avatar_' + user?.username);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function _getHex(colorName) {
  if (typeof COLORS === 'undefined') return null;
  return COLORS.find(c=>c.name===colorName)?.hex || null;
}
