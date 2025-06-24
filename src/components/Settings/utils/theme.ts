import { ThemeValue } from '../types';
import { config, debugLog } from '../../../config';
import { handleError, createStorageError, ErrorSeverity } from '../../../utils/errorHandling';

/**
 * Get the current theme setting from localStorage
 */
export const getTheme = (): ThemeValue => {
  debugLog('Retrieving theme setting from localStorage');
  try {
    const storedTheme = localStorage.getItem(config.storage.themeKey);
    return (storedTheme as ThemeValue) || 'system';
  } catch (error) {
    handleError(
      createStorageError(
        'Failed to retrieve theme setting from localStorage',
        ErrorSeverity.WARNING,
        error instanceof Error ? error : undefined
      ),
      'Settings: get theme'
    );
    return 'system';
  }
};

/**
 * Save theme setting to localStorage and trigger a storage event
 * to sync the theme across all windows
 */
export const saveTheme = (theme: ThemeValue): void => {
  debugLog('Saving theme setting to localStorage');
  try {
    localStorage.setItem(config.storage.themeKey, theme);
    
    // Force update in all windows (including current)
    window.dispatchEvent(new StorageEvent('storage', { key: config.storage.themeKey, newValue: theme }));
  } catch (error) {
    handleError(
      createStorageError(
        'Failed to save theme setting to localStorage',
        ErrorSeverity.WARNING,
        error instanceof Error ? error : undefined
      ),
      'Settings: save theme'
    );
  }
};