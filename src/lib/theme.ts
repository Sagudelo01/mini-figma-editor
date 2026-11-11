export type Theme = 'light' | 'dark'

export const THEME_KEY = 'mini-figma-theme'

export function getInitialTheme(): Theme {
  const current = document.documentElement.dataset.theme
  return current === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Storage may be unavailable (private mode); the theme still applies.
  }
}
