// Theme controller for Namma Route
// Manages light/dark theme switching, localStorage persistence, and 200ms transitions

const THEME_KEY = 'nr-theme';

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function getCurrentTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') || getStoredTheme() || getSystemTheme();
}

export function setTheme(theme, isUserAction = false) {
  if (typeof document === 'undefined') return;

  if (isUserAction) {
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 220);
  }

  document.documentElement.setAttribute('data-theme', theme);

  if (isUserAction) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }

  updateToggleState(theme);
}

export function toggleTheme() {
  const current = getCurrentTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next, true);
}

function updateToggleState(theme) {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;
  toggleBtn.setAttribute('data-current-theme', theme);
  const titleText = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  toggleBtn.setAttribute('title', titleText);
  toggleBtn.setAttribute('aria-label', titleText);
}

export function initTheme() {
  const initialTheme = getCurrentTheme();
  setTheme(initialTheme, false);

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleTheme();
    });
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getStoredTheme()) {
        setTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  }
}
