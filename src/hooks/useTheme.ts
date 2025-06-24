import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * Custom hook for theme management
 * @returns Object with theme state and functions
 */
export function useTheme() {
  const { themeMode, setThemeMode, systemTheme } = useAppContext();

  // Apply theme to document body
  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode === 'dark' ? 'dark' : 'light');
    
    // Apply CSS variables for theme
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      :root {
        --theme-mode: ${themeMode === 'dark' ? 'dark' : 'light'};
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [themeMode]);

  // Toggle between light and dark theme
  const toggleTheme = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  // Set theme to follow system preference
  const useSystemTheme = () => {
    setThemeMode('system');
  };

  return {
    themeMode,
    setThemeMode,
    systemTheme,
    toggleTheme,
    useSystemTheme,
    isDarkMode: themeMode === 'dark',
  };
}
