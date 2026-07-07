/* ==========================================
   CALENDAR.JS — Outfit Calendar & History
   ========================================== */

const CAL_KEY = u => 'styleai_calendar_' + u;

let _calUser   = null;
let _calData   = {};   // { 'YYYY-MM-DD': { outfitSlots, note, occasion } }
let _calYear   = 0;
let _calMonth  = 0;
let _calSelDay = null;

window.addEventListener('cloud-ready', () => {
  _calUser  = requireAuth();
  if (!_calUser) return;
  initAvatar(_calUser);

  const now    = new Date();
  _calYear     = now.getFullYear();
  _calMonth    = now.getMonth();
  _calData     = _loadCal();

  renderCalendar();
  _updateStreak();
});

// ── Storage ───────────────────────────────────────────────────────────────────

function _loadCal() {
  try { return JSON.parse(localStorage.getItem(CAL_KEY(_calUser.username))) || {}; }
  catch { return {}; }
}

function _saveCal() {
  try {
    localStorage.setItem(CAL_KEY(_calUser.username), JSON.stringify(_calData));
    window.cloudSync?.pushCalendar(_calUser.username, _calData);
  }
  catch { showToast('Could not save — storage full', 'error'); }
}

// ── Calendar render ───────────────────────────────────────────────────────────

function renderCalendar() {
  const grid      = document.getElementById('cal-grid');
  const monthLabel= document.getElementById('cal-month-label');
  if (!grid) return;

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  monthLabel.textContent = monthNames[_calMonth] + ' ' + _calYear;

  const firstDay  = new Date(_calYear, _calMonth, 1).getDay(); // 0=Sun
  const daysInMon = new Date(_calYear, _calMonth + 1, 0).getDate();
  const today     = new Date();
  const todayStr  = _dateKey(today);

  grid.innerHTML = '';

  // Day headers
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
    const h = document.createElement('div');
    h.className   = 'cal-day-header';
    h.textContent = d;
    grid.appendChild(h);
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const e = document.createElement('div');
    e.className = 'cal-cell empty';
    grid.appendChild(e);
  }

  // Day cells
  for (let d = 1; d <= daysInMon; d++) {
    const dateStr = _calYear + '-' + String(_calMonth + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const entry   = _calData[dateStr];
    const cell    = document.createElement('div');

    cell.className = 'cal-cell';
    if (dateStr === todayStr)      cell.classList.add('today');
    if (dateStr === _calSelDay)    cell.classList.add('selected');
    if (entry)                     cell.classList.add('has-outfit');

    const isFuture = new Date(_calYear, _calMonth, d) > today;
    if (isFuture) cell.classList.add('future');

    cell.innerHTML = `
      <span class="cal-date-num">${d}</span>
      ${entry ? '<span class="cal-dot"></span>' : ''}
    `;

    cell.onclick = () => openDayModal(dateStr, d);
    grid.appendChild(cell);
  }

  // Render recent history list
  _renderHistory();
}

function calPrevMonth() {
  _calMonth--;
  if (_calMonth < 0) { _calMonth = 11; _calYear--; }
  renderCalendar();
}

function calNextMonth() {
  _calMonth++;
  if (_calMonth > 11) { _calMonth = 0; _calYear++; }
  renderCalendar();
}

// ── Day modal ─────────────────────────────────────────────────────────────────

function openDayModal(dateStr, dayNum) {
  _calSelDay = dateStr;
  renderCalendar();

  const entry    = _calData[dateStr] || null;
  const isFuture = new Date(dateStr) > new Date();
  const label    = _friendlyDate(dateStr);

  document.getElementById('cal-modal-date').textContent = label;
  document.getElementById('cal-day-modal').classList.remove('hidden');

  const body = document.getElementById('cal-modal-body');

  if (entry) {
    // Show logged outfit
    const thumbs = (entry.slots || []).map(s =>
      s.item && s.item.imageData
        ? `<img src="${s.item.imageData}" class="cal-thumb" title="${s.item.color} ${s.item.subtype}" />`
        : `<div class="cal-thumb-emoji">${_catEmoji(s.item?.category)}</div>`
    ).join('');

    body.innerHTML = `
      <div class="cal-entry-thumbs">${thumbs || '<p style="color:var(--text-muted)">No photos</p>'}</div>
      <div class="cal-entry-meta">
        <span class="occ-chip">${entry.occasion || 'casual'}</span>
        ${entry.note ? `<p class="cal-note">"${entry.note}"</p>` : ''}
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:1rem">
        <button class="btn-danger" style="flex:1" onclick="removeCalEntry('${dateStr}')">Remove</button>
        <button class="btn-ghost"  style="flex:1" onclick="closeDayModal()">Close</button>
      </div>
    `;
  } else if (isFuture) {
    // Plan ahead
    body.innerHTML = `
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem">Plan your outfit for this day</p>
      ${_outfitPickerHTML(dateStr)}
    `;
  } else {
    // Log past day
    body.innerHTML = `
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem">What did you wear?</p>
      ${_outfitPickerHTML(dateStr)}
    `;
  }
}

function closeDayModal() {
  document.getElementById('cal-day-modal').classList.add('hidden');
  _calSelDay = null;
  renderCalendar();
}

function _outfitPickerHTML(dateStr) {
  // Show saved outfits to pick from + manual log option
  const key    = 'styleai_saved_outfits_' + _calUser.username;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}

  const wardrobe = _getWardrobe();

  let html = `
    <div class="form-group">
      <label>Occasion</label>
      <div class="pill-group" id="cal-occ-group" style="flex-wrap:wrap">
        <button type="button" class="pill active" data-val="casual"  onclick="selectPill('cal-occ-group',this)">Casual</button>
        <button type="button" class="pill"        data-val="work"    onclick="selectPill('cal-occ-group',this)">Work</button>
        <button type="button" class="pill"        data-val="party"   onclick="selectPill('cal-occ-group',this)">Party</button>
        <button type="button" class="pill"        data-val="date"    onclick="selectPill('cal-occ-group',this)">Date</button>
        <button type="button" class="pill"        data-val="ethnic"  onclick="selectPill('cal-occ-group',this)">Ethnic</button>
      </div>
    </div>
    <div class="form-group">
      <label>Note (optional)</label>
      <input type="text" id="cal-note-input" placeholder="e.g. Office party, wore new jacket" />
    </div>
  `;

  if (saved.length > 0) {
    html += `<p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.5rem">Pick a saved look:</p>
    <div class="cal-saved-scroll">`;
    saved.slice(0, 6).forEach(s => {
      const thumb = s.slots[0]?.item?.imageData
        ? `<img src="${s.slots[0].item.imageData}" class="cal-saved-thumb" />`
        : `<div class="cal-saved-thumb-emoji">${_catEmoji(s.slots[0]?.item?.category)}</div>`;
      html += `
        <div class="cal-saved-chip" onclick="logSavedOutfit('${dateStr}','${s.id}')">
          ${thumb}
          <span>${s.name}</span>
        </div>`;
    });
    html += `</div>`;
  }

  html += `
    <div style="display:flex;gap:0.5rem;margin-top:1rem">
      <button class="btn-ghost"   style="flex:1" onclick="closeDayModal()">Cancel</button>
      <button class="btn-primary" style="flex:1" onclick="logManualOutfit('${dateStr}')">Log Outfit</button>
    </div>`;

  return html;
}

function logManualOutfit(dateStr) {
  const occasion = document.querySelector('#cal-occ-group .pill.active')?.dataset.val || 'casual';
  const note     = document.getElementById('cal-note-input')?.value.trim() || '';
  // Get current wardrobe first 3 items as placeholder slots
  const wardrobe = _getWardrobe();
  const slots    = wardrobe.slice(0, 3).map(item => ({ role: item.category, item, label: item.category }));

  _calData[dateStr] = { slots, occasion, note, loggedAt: Date.now() };
  _saveCal();
  closeDayModal();
  _updateStreak();
  showToast('Outfit logged ✦');
}

function logSavedOutfit(dateStr, savedId) {
  const key  = 'styleai_saved_outfits_' + _calUser.username;
  let saved  = [];
  try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch {}
  const entry = saved.find(s => s.id === savedId);
  if (!entry) return;

  const occasion = document.querySelector('#cal-occ-group .pill.active')?.dataset.val || entry.occasion || 'casual';
  const note     = document.getElementById('cal-note-input')?.value.trim() || '';

  _calData[dateStr] = { slots: entry.slots, occasion, note, name: entry.name, loggedAt: Date.now() };
  _saveCal();
  closeDayModal();
  _updateStreak();
  showToast('Outfit logged ✦');
}

function removeCalEntry(dateStr) {
  delete _calData[dateStr];
  _saveCal();
  closeDayModal();
  showToast('Entry removed');
}

// ── History list ──────────────────────────────────────────────────────────────

function _renderHistory() {
  const list = document.getElementById('cal-history-list');
  if (!list) return;

  const entries = Object.entries(_calData)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 10);

  if (entries.length === 0) {
    list.innerHTML = '<p class="cal-empty">No outfits logged yet. Tap a day to start.</p>';
    return;
  }

  list.innerHTML = entries.map(([date, entry]) => {
    const thumbs = (entry.slots || []).slice(0, 3).map(s =>
      s.item?.imageData
        ? `<img src="${s.item.imageData}" class="cal-hist-thumb" />`
        : `<div class="cal-hist-thumb-emoji">${_catEmoji(s.item?.category)}</div>`
    ).join('');

    return `
      <div class="cal-hist-item" onclick="openDayModal('${date}')">
        <div class="cal-hist-date">
          <div class="cal-hist-day">${new Date(date + 'T12:00:00').getDate()}</div>
          <div class="cal-hist-mon">${new Date(date + 'T12:00:00').toLocaleString('default',{month:'short'})}</div>
        </div>
        <div class="cal-hist-thumbs">${thumbs}</div>
        <div class="cal-hist-info">
          <div class="cal-hist-name">${entry.name || _friendlyDate(date)}</div>
          <div class="cal-hist-occ">${entry.occasion || 'casual'}${entry.note ? ' · ' + entry.note : ''}</div>
        </div>
        <span class="cal-hist-arrow">›</span>
      </div>`;
  }).join('');
}

// ── Streak ────────────────────────────────────────────────────────────────────

function _updateStreak() {
  const el = document.getElementById('cal-streak');
  if (!el) return;

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (_calData[_dateKey(d)]) streak++;
    else if (i > 0) break;
  }

  el.textContent = streak > 0
    ? `🔥 ${streak}-day streak`
    : 'Start logging your outfits!';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _dateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function _friendlyDate(dateStr) {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });
  } catch { return dateStr; }
}

function _catEmoji(cat) {
  return {tops:'👕',bottoms:'👖',outerwear:'🧥',footwear:'👟',accessories:'⌚',ethnic:'🥻'}[cat]||'👗';
}

function _getWardrobe() {
  try { return JSON.parse(localStorage.getItem('styleai_wardrobe_' + _calUser.username)) || []; }
  catch { return []; }
}
