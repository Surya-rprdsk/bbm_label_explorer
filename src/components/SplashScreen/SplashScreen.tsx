import React, { useEffect, useRef } from 'react';
import tryCatch from '../index';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import './SplashScreen.css';
import { useTheme } from '../../hooks';

const SplashScreen: React.FC = () => {
  const indeterminateBarRef = useRef<HTMLDivElement>(null);
  const { themeMode } = useTheme();

  // Apply theme class for splash screen
  useEffect(() => {
    return tryCatch(() => {
      // Use themeMode from custom hook
      const prefersDark = themeMode === 'dark';
      
      // Apply theme class for the splash screen specifically
      document.body.classList.toggle('splash-dark-theme', prefersDark);
      
      return () => {
        // Clean up when component unmounts
        document.body.classList.remove('splash-dark-theme');
      };
    }, 'SplashScreen theme application');
  }, [themeMode]);
  
  return (
    <div className="splash-root">
      <div className="splash-logo">
        <MenuBookIcon className="splash-logo-icon" sx={{ width: 48, height: 48 }} />
      </div>
      <div className="splash-header">
        <h1 className="splash-title">BBM Label Explorer</h1>
      </div>
      <div className="splash-progress-outer">
        <div className="splash-progress-bar">
          <div ref={indeterminateBarRef} className="splash-indeterminate-bar">
            <div className="splash-indeterminate-bar1" />
            <div className="splash-indeterminate-bar2" />
          </div>
        </div>
      </div>
      <div className="splash-progress-text">Initializing...</div>
    </div>
  );
};

export default SplashScreen;
