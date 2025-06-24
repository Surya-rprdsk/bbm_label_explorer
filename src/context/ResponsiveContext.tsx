import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ResponsiveContextType {
  tableCellWidth: string;
  windowWidth: number;
  windowHeight: number;
  tableMaxHeight: string;
}

const ResponsiveContext = createContext<ResponsiveContextType>({
  tableCellWidth: '20%',
  windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
  windowHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
  tableMaxHeight: 'none',
});

interface ResponsiveProviderProps {
  children: ReactNode;
}

export const ResponsiveProvider = ({ children }: ResponsiveProviderProps) => {
  const [dimensions, setDimensions] = useState({
    tableCellWidth: '20%',
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
    tableMaxHeight: 'none',
  });

  useEffect(() => {
    // This effect applies the CSS variables using style elements rather than direct DOM manipulation
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      :root {
        --window-width: ${dimensions.windowWidth}px;
        --window-height: ${dimensions.windowHeight}px;
        --table-cell-width: ${dimensions.tableCellWidth};
        --table-max-height: ${dimensions.tableMaxHeight};
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [dimensions]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        tableCellWidth: window.innerWidth > 600 ? '20%' : '20%', // Currently the same but can be adjusted for different breakpoints
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        tableMaxHeight: 'none',
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <ResponsiveContext.Provider value={dimensions}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => useContext(ResponsiveContext);
