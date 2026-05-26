export type Theme = 'dark' | 'light' | 'system';

export const THEME_STORAGE_KEY = 'heardle-theme';

export const DEFAULT_THEME: Theme = 'dark';

export function resolveEffectiveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return theme;
}

export function resolveTheme(stored?: string | null): Theme {
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return DEFAULT_THEME;
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return DEFAULT_THEME;
  }
}
