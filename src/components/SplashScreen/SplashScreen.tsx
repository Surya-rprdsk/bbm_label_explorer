import React, { useEffect, useRef } from 'react';
import { tryCatch } from '../index';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
  const progressInnerRef = useRef<HTMLDivElement>(null);
  const indeterminateBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLDivElement>(null);
  const lastNumeric = useRef<number | null>(null);
  const indeterminateTimeout = useRef<any>(null);

  useEffect(() => {
    return tryCatch(() => {
      function showIndeterminate() {
        if (progressInnerRef.current) progressInnerRef.current.style.display = 'none';
        if (indeterminateBarRef.current) indeterminateBarRef.current.style.display = 'block';
      }
      function showDeterminate() {
        if (progressInnerRef.current) progressInnerRef.current.style.display = 'block';
        if (indeterminateBarRef.current) indeterminateBarRef.current.style.display = 'none';
      }
      showIndeterminate();
      // Listen for Tauri event
      // @ts-ignore
      if (window.__TAURI__ && window.__TAURI__.event) {
        // @ts-ignore
        window.__TAURI__.event.listen('keyword-loading-progress', function(event: any) {
          tryCatch(() => {
            if (!progressTextRef.current || !progressInnerRef.current) return;
            if (event.payload === 'done') {
              progressTextRef.current.textContent = 'Loading complete!';
              showDeterminate();
              progressInnerRef.current.style.width = '100%';
            } else if (typeof event.payload === 'number') {
              progressTextRef.current.textContent = `Loading: ${event.payload}%`;
              showDeterminate();
              progressInnerRef.current.style.transition = 'none';
              progressInnerRef.current.style.width = progressInnerRef.current.style.width; // force reflow
              setTimeout(() => {
                if (progressInnerRef.current) {
                  progressInnerRef.current.style.transition = 'width 0.2s';
                  const percent = Math.max(0, Math.min(100, event.payload));
                  progressInnerRef.current.style.width = percent + '%';
                }
              }, 10);
              lastNumeric.current = Date.now();
              if (indeterminateTimeout.current) clearTimeout(indeterminateTimeout.current);
            } else if (typeof event.payload === 'string') {
              progressTextRef.current.textContent = event.payload;
              if (indeterminateTimeout.current) clearTimeout(indeterminateTimeout.current);
              indeterminateTimeout.current = setTimeout(() => {
                if (!lastNumeric.current || Date.now() - lastNumeric.current > 900) {
                  showIndeterminate();
                }
              }, 900);
            }
          }, 'SplashScreen event listener');
        });
      }
      return () => {
        if (indeterminateTimeout.current) clearTimeout(indeterminateTimeout.current);
      };
    }, 'SplashScreen useEffect');
  }, []);

  return (
    <div className="splash-root">
      <div className="splash-header">
        {/* <span className="material-icons" style={{ fontSize: 48, color: '#fff' }}>hourglass_top</span> */}
        <h1 className="splash-title">Label Assistant</h1>
      </div>
      <div className="splash-progress-outer">
        <div className="splash-progress-bar">
          <div ref={progressInnerRef} className="splash-progress-inner" />
          <div ref={indeterminateBarRef} className="splash-indeterminate-bar">
            <div className="splash-indeterminate-bar1" />
            <div className="splash-indeterminate-bar2" />
          </div>
        </div>
      </div>
      <div ref={progressTextRef} className="splash-progress-text">Initializing...</div>
    </div>
  );
};

export default SplashScreen;
