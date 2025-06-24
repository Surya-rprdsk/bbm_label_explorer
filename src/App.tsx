import { useState, useEffect, useMemo } from 'react';
import { KeywordSearch, Settings, SplashScreen } from './components';
import './components/KeywordSearch/KeywordSearch.css';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AppProvider } from './context/AppContext';
import { ResponsiveProvider } from './context/ResponsiveContext';
import { useTheme } from './hooks';

function ThemedApp() {
  // Use our custom theme hook
  const { themeMode } = useTheme();
  
  const isSplashWindow = window.location.hash === '#splash';
  const isSettingsWindow = window.location.pathname.endsWith('/settings.html');
  const [showSplash, setShowSplash] = useState(isSplashWindow);

  // Create theme based on current mode
  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeMode === 'dark' ? 'dark' : 'light',
    },
    typography: {
      fontFamily: 'Arial, "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 14,
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
  }), [themeMode]);
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
  
  // Empty useEffect to replace the old window resizing code
  useEffect(() => {
    // No need for direct DOM manipulation - ResponsiveContext handles window resizing
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Dedicated space for settings menu, now with theme switch */}
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

export default function App() {
  return (
    <AppProvider>
      <ResponsiveProvider>
        <ThemedApp />
      </ResponsiveProvider>
    </AppProvider>
  );
}
