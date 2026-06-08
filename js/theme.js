/* ==========================================
   THEME.JS — Dark / Light theme toggle
   ========================================== */

const THEME_KEY = 'styleai_theme';

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved, false);
}

function applyTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  if (save) localStorage.setItem(THEME_KEY, theme);
  // Update any toggle buttons
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title       = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  });
}

function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

// Auto-init
initTheme();
