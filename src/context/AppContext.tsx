import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { config } from '../config';

// Define the shape of our context state
interface AppContextType {
  themeMode: string;
  setThemeMode: (theme: string) => void;
  systemTheme: string;
}

// Create context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Function to get system theme preference
function getSystemTheme(): string {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Get theme from localStorage or use system preference
  const [themeMode, setThemeModeState] = useState<string>(() => {
    const stored = localStorage.getItem(config.storage.themeKey);
    if (stored === 'system' || !stored) return getSystemTheme();
    return stored;
  });
  
  const [systemTheme, setSystemTheme] = useState<string>(getSystemTheme());

  // Handle theme changes from localStorage
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === config.storage.themeKey) {
        const newTheme = e.newValue === 'system' ? getSystemTheme() : e.newValue;
        setThemeModeState(newTheme || 'light');
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const newSystemTheme = getSystemTheme();
      setSystemTheme(newSystemTheme);
      
      // If current theme is set to 'system', update the active theme
      const currentSetting = localStorage.getItem(config.storage.themeKey);
      if (currentSetting === 'system') {
        setThemeModeState(newSystemTheme);
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } 
    // Older browsers
    else if ('addListener' in mediaQuery) {
      // @ts-ignore - For older browsers
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } 
      else if ('removeListener' in mediaQuery) {
        // @ts-ignore - For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Wrapper for theme setting that handles localStorage
  const setThemeMode = (theme: string) => {
    localStorage.setItem(config.storage.themeKey, theme);
    if (theme === 'system') {
      setThemeModeState(getSystemTheme());
    } else {
      setThemeModeState(theme);
    }
  };

  return (
    <AppContext.Provider value={{ themeMode, setThemeMode, systemTheme }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
