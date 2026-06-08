/* ==========================================
   UI.JS — Shared UI Utilities
   ========================================== */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function selectPill(groupId, btn) {
  const group = document.getElementById(groupId) || btn.closest('.pill-group');
  if (group) {
    group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  }
  btn.classList.add('active');
}

function goTo(page) {
  window.location.href = page + '.html';
}

// Populate city selects
function populateCitySelect(selectId, selectedCity) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '';
  CITIES.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    if (city === selectedCity) opt.selected = true;
    sel.appendChild(opt);
  });
}

// Toast notification
function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed; bottom: calc(80px + env(safe-area-inset-bottom));
    left: 50%; transform: translateX(-50%);
    background: ${type === 'error' ? 'var(--red-dim)' : 'var(--bg-elevated)'};
    color: ${type === 'error' ? 'var(--red)' : 'var(--text-primary)'};
    border: 1px solid ${type === 'error' ? 'rgba(224,92,92,0.3)' : 'var(--border)'};
    padding: 0.7rem 1.4rem; border-radius: 100px;
    font-family: 'DM Sans', sans-serif; font-size: 0.85rem;
    z-index: 9999; white-space: nowrap;
    animation: slideUp 0.25s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// Init city dropdowns on page load
document.addEventListener('DOMContentLoaded', () => {
  // Populate city selects on auth pages
  const regCity = document.getElementById('reg-city');
  if (regCity) populateCitySelect('reg-city', 'Mumbai');
});
