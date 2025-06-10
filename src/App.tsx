import { useState, useEffect, useMemo } from 'react';
import { KeywordSearch, Settings, SplashScreen } from './components';
import './components/KeywordSearch/KeywordSearch.css';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function useMaterialTheme(): [object, string, (theme: string) => void] {
  const [themeMode, setThemeMode] = useState(() => {
    const stored = localStorage.getItem('settings_theme');
    if (stored === 'system' || !stored) return getSystemTheme();
    return stored;
  });

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === 'settings_theme') {
        const newTheme = e.newValue === 'system' ? getSystemTheme() : e.newValue;
        setThemeMode(newTheme || 'light');
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('settings_theme');
    if (stored === 'system' || !stored) {
      setThemeMode(getSystemTheme());
    } else {
      setThemeMode(stored);
    }
  }, [localStorage.getItem('settings_theme')]);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode === 'dark' ? 'dark' : 'light',
    },
  }), [themeMode]);

  return [theme, themeMode, (t: string) => {
    localStorage.setItem('settings_theme', t);
    setThemeMode(t === 'system' ? getSystemTheme() : t);
  }];
}

export default function App() {
  const [theme, themeMode, setThemeMode] = useMaterialTheme();
  const isSplashWindow = window.location.hash === '#splash';
  const isSettingsWindow = window.location.pathname.endsWith('/settings.html');
  const [showSplash, setShowSplash] = useState(isSplashWindow);

  useEffect(() => {
    if (!isSplashWindow) return;
    // Listen for the Tauri event to hide splash when loading is done
    // @ts-ignore
    if (window.__TAURI__ && window.__TAURI__.event) {
      // @ts-ignore
      window.__TAURI__.event.listen('keyword-loading-progress', (event: any) => {
        if (event.payload === 'done') {
          setTimeout(() => setShowSplash(false), 400); // fade out after short delay
        }
      });
    }
  }, [isSplashWindow]);

  useEffect(() => {
    // Set data-theme attribute for dark/light mode, except splash screen
    if (!isSplashWindow) {
      document.body.setAttribute('data-theme', themeMode === 'dark' ? 'dark' : 'light');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [themeMode, isSplashWindow]);

  // Theme switch button handler
  const handleThemeSwitch = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Floating theme switch button, only show in main menu */}
      {!isSplashWindow && !isSettingsWindow && (
        <button
          className="theme-switch-btn fixed-top-right"
          onClick={handleThemeSwitch}
          title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </button>
      )}
      {/* Dedicated space for settings menu */}
      {isSettingsWindow && (
        <Settings />
      )}
      {isSplashWindow && showSplash ? <SplashScreen /> :
        isSplashWindow && !showSplash ? null :
        !isSettingsWindow ? <KeywordSearch /> : null
      }
    </ThemeProvider>
  );
}
