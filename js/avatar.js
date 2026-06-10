/* ==========================================
   AVATAR.JS
   Cartoon avatar generated from profile photo
   Skin tone + hair color detected via canvas
   Outfit layers drawn as SVG on the avatar
   ========================================== */

// ── Color detection ────────────────────────────────────────────────────────────

async function detectSkinAndHair(dataUrl) {
  return new Promise(resolve => {
    if (!dataUrl || !dataUrl.startsWith('data:')) { resolve(_defaultColors()); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 60; c.height = 80;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 60, 80);
        const d = ctx.getImageData(0, 0, 60, 80).data;

        // Sample face zone (top-center 30% of image)
        let fr=0,fg=0,fb=0,fn=0;
        for (let y=4; y<24; y++) {
          for (let x=15; x<45; x++) {
            const i=(y*60+x)*4;
            const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];
            if (a<128) continue;
            // Skin-ish pixels: reddish, not too dark, not too bright
            if (r>60 && g>40 && b>20 && r>b && r>g*0.6) {
              fr+=r; fg+=g; fb+=b; fn++;
            }
          }
        }

        // Sample hair zone (very top strip)
        let hr=0,hg=0,hb=0,hn=0;
        for (let y=0; y<6; y++) {
          for (let x=10; x<50; x++) {
            const i=(y*60+x)*4;
            const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];
            if (a<128) continue;
            const bright=(r+g+b)/3;
            if (bright<180) { hr+=r; hg+=g; hb+=b; hn++; }
          }
        }

        const skin = fn>0
          ? { r:Math.round(fr/fn), g:Math.round(fg/fn), b:Math.round(fb/fn) }
          : { r:210, g:170, b:130 };
        const hair = hn>0
          ? { r:Math.round(hr/hn), g:Math.round(hg/hn), b:Math.round(hb/hn) }
          : { r:60, g:40, b:30 };

        resolve({ skin: _rgb(skin), hair: _rgb(hair),
          skinDark:  _darken(skin, 0.82),
          skinLight: _lighten(skin, 1.18),
          eyeColor:  _eyeColor(skin) });
      } catch(e) { resolve(_defaultColors()); }
    };
    img.onerror = () => resolve(_defaultColors());
    img.src = dataUrl;
  });
}

function _defaultColors() {
  return {
    skin:'#d4956a', hair:'#3d2a1a',
    skinDark:'#b8784e', skinLight:'#e8b090',
    eyeColor:'#4a3020'
  };
}

function _rgb({r,g,b}) { return `rgb(${r},${g},${b})`; }
function _darken({r,g,b},f) { return `rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`; }
function _lighten({r,g,b},f) {
  return `rgb(${Math.min(255,Math.round(r*f))},${Math.min(255,Math.round(g*f))},${Math.min(255,Math.round(b*f))})`; }
function _eyeColor(skin) {
  const bright=(skin.r+skin.g+skin.b)/3;
  if (bright<100) return '#8B5E3C'; // dark skin → brown eyes
  if (bright<160) return '#4a3020'; // medium → dark brown
  return '#5a7a8a'; // light → can be hazel/blue
}

// ── SVG Avatar Generator ───────────────────────────────────────────────────────

/**
 * generateAvatarSVG(colors, gender, bodyType, outfit)
 * Returns an SVG string — animated cartoon avatar with optional outfit layers.
 * @param {object}  colors   — {skin, hair, skinDark, skinLight, eyeColor}
 * @param {string}  gender   — 'male'|'female'|'nonbinary'
 * @param {string}  bodyType — 'slim'|'athletic'|'average'|'broad'|'plus'
 * @param {object}  outfit   — {top, bottom, outerwear, footwear} each {color, subtype, imageData}
 */
function generateAvatarSVG(colors, gender, bodyType, outfit = {}) {
  const c  = colors || _defaultColors();
  const isFemale = gender === 'female';

  // Body proportions by body type
  const props = {
    slim:     { shoulderW:58, hipW:52, waistW:42, legW:18 },
    athletic: { shoulderW:70, hipW:58, waistW:50, legW:22 },
    average:  { shoulderW:64, hipW:60, waistW:52, legW:20 },
    broad:    { shoulderW:78, hipW:66, waistW:60, legW:24 },
    plus:     { shoulderW:76, hipW:78, waistW:70, legW:26 },
  }[bodyType] || { shoulderW:64, hipW:60, waistW:52, legW:20 };

  if (isFemale) { props.hipW += 8; props.waistW -= 4; }

  const cx = 100; // center x
  const sw = props.shoulderW/2;
  const hw = props.hipW/2;
  const ww = props.waistW/2;
  const lw = props.legW/2;

  // Outfit colors with smart defaults
  const topColor    = _outfitHex(outfit.top)    || (isFemale ? '#e8a0b0' : '#4a7ab5');
  const bottomColor = _outfitHex(outfit.bottom) || (isFemale ? '#8a6aa0' : '#3a5a8a');
  const shoeColor   = _outfitHex(outfit.footwear) || '#4a3a2a';
  const outerColor  = _outfitHex(outfit.outerwear);
  const topSubtype  = outfit.top?.subtype?.toLowerCase() || '';
  const btmSubtype  = outfit.bottom?.subtype?.toLowerCase() || '';
  const isShorts    = btmSubtype.includes('short');
  const isDress     = btmSubtype.includes('dress') || btmSubtype.includes('skirt');
  const isSaree     = btmSubtype.includes('saree') || btmSubtype.includes('kurta');

  // Accessory
  const hasWatch    = outfit.accessory?.subtype?.toLowerCase().includes('watch');
  const hasBelt     = outfit.accessory?.subtype?.toLowerCase().includes('belt');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 340" style="overflow:visible">
  <defs>
    <style>
      .avatar-body { animation: breathe 3s ease-in-out infinite; transform-origin: 100px 200px; }
      .avatar-head { animation: headbob 3s ease-in-out infinite; transform-origin: 100px 95px; }
      @keyframes breathe {
        0%,100%{transform:scaleY(1) translateY(0)}
        50%{transform:scaleY(1.012) translateY(-1px)}
      }
      @keyframes headbob {
        0%,100%{transform:translateY(0)}
        50%{transform:translateY(-2px)}
      }
    </style>
    <!-- Shadow -->
    <radialGradient id="shadow-g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.18)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <!-- Skin gradient -->
    <linearGradient id="skin-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${c.skinLight}"/>
      <stop offset="100%" stop-color="${c.skinDark}"/>
    </linearGradient>
    <!-- Top fabric pattern -->
    <pattern id="top-pat" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="${topColor}"/>
      <rect x="0" y="3" width="8" height="1" fill="rgba(0,0,0,0.06)"/>
    </pattern>
  </defs>

  <!-- Drop shadow -->
  <ellipse cx="${cx}" cy="332" rx="38" ry="8" fill="url(#shadow-g)"/>

  <!-- ── BODY GROUP (animated) ── -->
  <g class="avatar-body">

    <!-- LEGS -->
    ${_legs(cx, lw, isShorts, isDress, bottomColor, shoeColor, c)}

    <!-- TORSO / BODY SHAPE -->
    ${_torso(cx, sw, hw, ww, topColor, bottomColor, outerColor, isFemale, isShorts, isDress, isSaree)}

    <!-- ARMS -->
    ${_arms(cx, sw, c, topColor, outerColor)}

    <!-- BELT -->
    ${hasBelt ? `<rect x="${cx-ww-2}" y="200" width="${ww*2+4}" height="7" rx="3" fill="#2a1a0a" opacity="0.85"/>
      <rect x="${cx-5}" y="199" width="10" height="9" rx="2" fill="#c9a030"/>` : ''}

    <!-- WATCH -->
    ${hasWatch ? `<rect x="${cx+sw+8}" y="175" width="14" height="10" rx="3" fill="#1a1a1a" opacity="0.9"/>
      <rect x="${cx+sw+10}" y="177" width="10" height="6" rx="2" fill="#2a8af0"/>` : ''}

  </g><!-- end body -->

  <!-- ── HEAD GROUP (separate animation) ── -->
  <g class="avatar-head">
    ${_head(cx, c, isFemale, gender)}
  </g>
</svg>`;
}

// ── Body part generators ───────────────────────────────────────────────────────

function _legs(cx, lw, isShorts, isDress, bottomColor, shoeColor, c) {
  if (isDress) {
    // Skirt/dress — single flared shape
    return `
    <path d="M${cx-22} 205 Q${cx-28} 285 ${cx-26} 310 L${cx+26} 310 Q${cx+28} 285 ${cx+22} 205 Z"
          fill="${bottomColor}" opacity="0.92"/>
    <!-- Dress hem detail -->
    <path d="M${cx-26} 298 Q${cx} 308 ${cx+26} 298 L${cx+26} 310 L${cx-26} 310 Z"
          fill="rgba(0,0,0,0.1)"/>
    <!-- Feet -->
    <ellipse cx="${cx-12}" cy="313" rx="11" ry="5" fill="${shoeColor}" opacity="0.9"/>
    <ellipse cx="${cx+12}" cy="313" rx="11" ry="5" fill="${shoeColor}" opacity="0.9"/>`;
  }

  const legBot = isShorts ? 255 : 308;
  const skinOrBottom = isShorts ? c.skin : bottomColor;

  return `
  <!-- Left leg -->
  <path d="M${cx-lw-4} 205 L${cx-lw-4} ${legBot} Q${cx-lw} ${legBot+6} ${cx-2} ${legBot+6}
           L${cx-2} 205 Z" fill="${skinOrBottom}" opacity="0.92"/>
  <!-- Right leg -->
  <path d="M${cx+2} 205 L${cx+2} ${legBot+6} Q${cx+lw} ${legBot+6} ${cx+lw+4} ${legBot}
           L${cx+lw+4} 205 Z" fill="${skinOrBottom}" opacity="0.92"/>
  <!-- Leg shadow/crease -->
  <line x1="${cx-2}" y1="210" x2="${cx-2}" y2="${legBot}" stroke="rgba(0,0,0,0.08)" stroke-width="2"/>

  ${isShorts ? `<!-- Shorts overlay -->
  <path d="M${cx-lw-8} 205 L${cx-lw-4} 255 L${cx+lw+4} 255 L${cx+lw+8} 205 Z"
        fill="${bottomColor}" opacity="0.92"/>` : ''}

  <!-- Left shoe -->
  <rect x="${cx-lw-12}" y="${legBot}" width="${lw*2+4}" height="12" rx="6"
        fill="${shoeColor}" opacity="0.92"/>
  <rect x="${cx-lw-12}" y="${legBot}" width="${lw+2}" height="8" rx="4"
        fill="rgba(255,255,255,0.12)"/>
  <!-- Right shoe -->
  <rect x="${cx+2}" y="${legBot}" width="${lw*2+4}" height="12" rx="6"
        fill="${shoeColor}" opacity="0.92"/>
  <rect x="${cx+2}" y="${legBot}" width="${lw+2}" height="8" rx="4"
        fill="rgba(255,255,255,0.12)"/>`;
}

function _torso(cx, sw, hw, ww, topColor, bottomColor, outerColor, isFemale, isShorts, isDress, isSaree) {
  // Torso path: shoulders→waist→hips
  const torsoPath = `M${cx-sw} 128 L${cx-ww} 200 L${cx+ww} 200 L${cx+sw} 128 Z`;
  const hipPath   = isDress ? '' :
    `M${cx-ww} 200 L${cx-hw} 212 L${cx+hw} 212 L${cx+ww} 200 Z`;

  let r = `
  <!-- Bottom/hip layer -->
  ${!isDress ? `<path d="${hipPath}" fill="${bottomColor}" opacity="0.93"/>` : ''}

  <!-- Torso - top clothing -->
  <path d="${torsoPath}" fill="${topColor}" opacity="0.93"/>

  <!-- Top collar / neckline -->
  ${isFemale
    ? `<path d="M${cx-12} 128 Q${cx} 142 ${cx+12} 128" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>`
    : `<path d="M${cx-10} 128 L${cx-6} 138 L${cx+6} 138 L${cx+10} 128" fill="rgba(0,0,0,0.12)"/>`}

  <!-- Shirt pocket / button detail -->
  ${!isFemale ? `<rect x="${cx-14}" y="148" width="9" height="7" rx="2" fill="rgba(0,0,0,0.1)"/>
  <line x1="${cx}" y1="140" x2="${cx}" y2="195" stroke="rgba(0,0,0,0.08)" stroke-width="1.5"/>` : ''}

  <!-- Torso shading -->
  <path d="${torsoPath}" fill="url(#shade-t)" opacity="0.18"/>`;

  if (outerColor) {
    // Outerwear (open jacket / blazer)
    r += `
  <!-- Outer jacket left panel -->
  <path d="M${cx-sw} 128 L${cx-sw+4} 200 L${cx-8} 200 L${cx-8} 136 Z"
        fill="${outerColor}" opacity="0.9"/>
  <!-- Outer jacket right panel -->
  <path d="M${cx+sw} 128 L${cx+sw-4} 200 L${cx+8} 200 L${cx+8} 136 Z"
        fill="${outerColor}" opacity="0.9"/>
  <!-- Lapels -->
  <path d="M${cx-8} 136 L${cx-sw+4} 128 L${cx-sw+12} 148 Z" fill="rgba(255,255,255,0.15)"/>
  <path d="M${cx+8} 136 L${cx+sw-4} 128 L${cx+sw-12} 148 Z" fill="rgba(255,255,255,0.15)"/>`;
  }

  return r;
}

function _arms(cx, sw, c, topColor, outerColor) {
  const armColor = outerColor || topColor;
  return `
  <!-- Left arm (upper) -->
  <path d="M${cx-sw} 135 Q${cx-sw-18} 158 ${cx-sw-12} 185"
        fill="none" stroke="${armColor}" stroke-width="${sw > 34 ? 18 : 15}" stroke-linecap="round" opacity="0.92"/>
  <!-- Left forearm / hand -->
  <path d="M${cx-sw-12} 185 Q${cx-sw-8} 205 ${cx-sw-4} 210"
        fill="none" stroke="${c.skin}" stroke-width="12" stroke-linecap="round"/>
  <!-- Left hand -->
  <ellipse cx="${cx-sw-3}" cy="212" rx="8" ry="6" fill="${c.skin}"/>

  <!-- Right arm (upper) -->
  <path d="M${cx+sw} 135 Q${cx+sw+18} 158 ${cx+sw+12} 185"
        fill="none" stroke="${armColor}" stroke-width="${sw > 34 ? 18 : 15}" stroke-linecap="round" opacity="0.92"/>
  <!-- Right forearm / hand -->
  <path d="M${cx+sw+12} 185 Q${cx+sw+8} 205 ${cx+sw+4} 210"
        fill="none" stroke="${c.skin}" stroke-width="12" stroke-linecap="round"/>
  <!-- Right hand -->
  <ellipse cx="${cx+sw+3}" cy="212" rx="8" ry="6" fill="${c.skin}"/>`;
}

function _head(cx, c, isFemale, gender) {
  const headY = 78;
  const headRx = 30, headRy = 35;

  // Hair styles by gender
  const hairTop = isFemale
    ? `<!-- Long hair -->
       <ellipse cx="${cx}" cy="${headY-20}" rx="34" ry="28" fill="${c.hair}"/>
       <path d="M${cx-33} ${headY-5} Q${cx-42} ${headY+30} ${cx-38} ${headY+60}"
             fill="none" stroke="${c.hair}" stroke-width="14" stroke-linecap="round"/>
       <path d="M${cx+33} ${headY-5} Q${cx+42} ${headY+30} ${cx+38} ${headY+60}"
             fill="none" stroke="${c.hair}" stroke-width="14" stroke-linecap="round"/>`
    : gender === 'nonbinary'
    ? `<!-- Wavy medium hair -->
       <ellipse cx="${cx}" cy="${headY-22}" rx="33" ry="26" fill="${c.hair}"/>
       <path d="M${cx-32} ${headY+5} Q${cx-40} ${headY+25} ${cx-35} ${headY+45}"
             fill="none" stroke="${c.hair}" stroke-width="10" stroke-linecap="round"/>
       <path d="M${cx+32} ${headY+5} Q${cx+40} ${headY+25} ${cx+35} ${headY+45}"
             fill="none" stroke="${c.hair}" stroke-width="10" stroke-linecap="round"/>`
    : `<!-- Short hair with fade -->
       <ellipse cx="${cx}" cy="${headY-24}" rx="31" ry="22" fill="${c.hair}"/>
       <path d="M${cx-30} ${headY-10} Q${cx-26} ${headY-6} ${cx-18} ${headY-4}" fill="none" stroke="${c.hair}" stroke-width="8"/>
       <path d="M${cx+30} ${headY-10} Q${cx+26} ${headY-6} ${cx+18} ${headY-4}" fill="none" stroke="${c.hair}" stroke-width="8"/>`;

  return `
  ${hairTop}

  <!-- Neck -->
  <rect x="${cx-10}" y="${headY+32}" width="20" height="18" rx="6" fill="url(#skin-g)"/>

  <!-- Head -->
  <ellipse cx="${cx}" cy="${headY}" rx="${headRx}" ry="${headRy}" fill="url(#skin-g)"/>

  <!-- Cheek blush -->
  <ellipse cx="${cx-19}" cy="${headY+8}" rx="8" ry="6" fill="rgba(220,120,100,0.18)"/>
  <ellipse cx="${cx+19}" cy="${headY+8}" rx="8" ry="6" fill="rgba(220,120,100,0.18)"/>

  <!-- Eyes -->
  <!-- Eye whites -->
  <ellipse cx="${cx-11}" cy="${headY}" rx="8" ry="6" fill="white"/>
  <ellipse cx="${cx+11}" cy="${headY}" rx="8" ry="6" fill="white"/>
  <!-- Irises -->
  <circle  cx="${cx-11}" cy="${headY}" r="4.5" fill="${c.eyeColor}"/>
  <circle  cx="${cx+11}" cy="${headY}" r="4.5" fill="${c.eyeColor}"/>
  <!-- Pupils -->
  <circle  cx="${cx-11}" cy="${headY}" r="2.2" fill="#111"/>
  <circle  cx="${cx+11}" cy="${headY}" r="2.2" fill="#111"/>
  <!-- Eye shine -->
  <circle  cx="${cx-9.5}" cy="${headY-1.5}" r="1.2" fill="white"/>
  <circle  cx="${cx+12.5}" cy="${headY-1.5}" r="1.2" fill="white"/>
  <!-- Eyelids / lashes -->
  <path d="M${cx-19} ${headY-2} Q${cx-11} ${headY-8} ${cx-3} ${headY-2}"
        fill="none" stroke="#2a1a0a" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M${cx+3} ${headY-2} Q${cx+11} ${headY-8} ${cx+19} ${headY-2}"
        fill="none" stroke="#2a1a0a" stroke-width="1.8" stroke-linecap="round"/>

  <!-- Eyebrows -->
  <path d="M${cx-20} ${headY-12} Q${cx-11} ${headY-16} ${cx-3} ${headY-12}"
        fill="none" stroke="${c.hair}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M${cx+3} ${headY-12} Q${cx+11} ${headY-16} ${cx+20} ${headY-12}"
        fill="none" stroke="${c.hair}" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Nose -->
  <path d="M${cx-4} ${headY+10} Q${cx} ${headY+18} ${cx+4} ${headY+10}"
        fill="none" stroke="${c.skinDark}" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>

  <!-- Smile -->
  <path d="M${cx-10} ${headY+20} Q${cx} ${headY+28} ${cx+10} ${headY+20}"
        fill="none" stroke="${c.skinDark}" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>

  <!-- Ear studs (female) -->
  ${isFemale ? `<circle cx="${cx-30}" cy="${headY+2}" r="4" fill="${c.skin}"/>
    <circle cx="${cx-30}" cy="${headY+2}" r="2.5" fill="${c.skinLight}"/>
    <circle cx="${cx-28}" cy="${headY+8}" r="2.5" fill="#e0c060" opacity="0.9"/>
    <circle cx="${cx+30}" cy="${headY+2}" r="4" fill="${c.skin}"/>
    <circle cx="${cx+30}" cy="${headY+2}" r="2.5" fill="${c.skinLight}"/>
    <circle cx="${cx+28}" cy="${headY+8}" r="2.5" fill="#e0c060" opacity="0.9"/>` : ''}`;
}

// ── Color helper ───────────────────────────────────────────────────────────────

function _outfitHex(item) {
  if (!item || !item.color) return null;
  if (typeof COLORS === 'undefined') return null;
  const found = COLORS.find(c => c.name === item.color);
  return found ? found.hex : null;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * buildAvatarColors(profilePhotoDataUrl) → Promise<colors>
 * Detect skin/hair from photo, return color object.
 */
async function buildAvatarColors(profilePhotoDataUrl) {
  if (!profilePhotoDataUrl) return _defaultColors();
  return await detectSkinAndHair(profilePhotoDataUrl);
}

/**
 * renderAvatarInto(containerEl, user, outfit)
 * Renders animated cartoon avatar into containerEl.
 */
async function renderAvatarInto(containerEl, user, outfit) {
  if (!containerEl) return;

  // Show loading state
  containerEl.innerHTML = `<div class="avatar-loading">
    <div class="avatar-loading-fig">🧍</div>
    <p>Building your avatar…</p>
  </div>`;

  const colors = await buildAvatarColors(user.profilePhoto || null);

  // Cache colors on user object for reuse
  if (user) user._avatarColors = colors;

  const svg = generateAvatarSVG(
    colors,
    user.gender    || 'male',
    user.bodyType  || 'average',
    outfit         || {}
  );

  containerEl.innerHTML = svg;
}

/**
 * renderAvatarWithOutfit(containerEl, user, outfitSlots)
 * Converts outfit slots array into the outfit object format.
 */
async function renderAvatarWithOutfit(containerEl, user, slots) {
  const outfit = {};
  if (slots) {
    slots.forEach(s => {
      if (s.role === 'top')       outfit.top       = s.item;
      if (s.role === 'bottom')    outfit.bottom     = s.item;
      if (s.role === 'outerwear') outfit.outerwear  = s.item;
      if (s.role === 'footwear')  outfit.footwear   = s.item;
      if (s.role === 'accessory') outfit.accessory  = s.item;
    });
  }
  await renderAvatarInto(containerEl, user, outfit);
}

// ── Profile photo — update everywhere ─────────────────────────────────────────

/**
 * updateProfilePhoto(dataUrl)
 * Saves new profile photo and refreshes all avatar elements on the page.
 */
async function updateProfilePhoto(dataUrl) {
  if (!dataUrl) return;
  const user = getCurrentUser();
  if (!user) return;

  updateCurrentUser({ profilePhoto: dataUrl });
  user.profilePhoto = dataUrl;

  // Re-detect colors
  const colors = await buildAvatarColors(dataUrl);
  user._avatarColors = colors;

  // Refresh all topbar mini-avatars
  _refreshMiniAvatars(user);

  // Refresh profile page large display
  const profilePhotoEl = document.getElementById('profile-photo-display');
  if (profilePhotoEl) {
    profilePhotoEl.src = dataUrl;
    profilePhotoEl.classList.remove('hidden');
    document.getElementById('profile-photo-initials')?.classList.add('hidden');
  }

  return user;
}

function _refreshMiniAvatars(user) {
  document.querySelectorAll('.topbar-avatar-img').forEach(img => {
    if (user.profilePhoto) {
      img.src = user.profilePhoto;
      img.classList.remove('hidden');
      img.parentElement?.querySelector('.topbar-avatar-initials')?.classList.add('hidden');
    }
  });
}

/**
 * initPageAvatar(user)
 * Call this on every page load after requireAuth().
 * Sets up topbar mini-avatar from profile photo.
 */
function initPageAvatar(user) {
  if (!user) return;
  _refreshMiniAvatars(user);
}
