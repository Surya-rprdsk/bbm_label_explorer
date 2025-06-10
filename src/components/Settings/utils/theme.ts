import { ThemeValue } from '../types';
import { THEME_KEY } from '../constants';

/**
 * Get the current theme setting from localStorage
 */
export const getTheme = (): ThemeValue => {
  const storedTheme = localStorage.getItem(THEME_KEY);
  return (storedTheme as ThemeValue) || 'system';
};

/**
 * Save theme setting to localStorage and trigger a storage event
 * to sync the theme across all windows
 */
export const saveTheme = (theme: ThemeValue): void => {
  localStorage.setItem(THEME_KEY, theme);
  
  // Force update in all windows (including current)
  window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY, newValue: theme }));
};