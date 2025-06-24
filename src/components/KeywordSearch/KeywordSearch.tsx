import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import "./KeywordSearch.css";
import "./responsive.css";
import {
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CloseIcon from '@mui/icons-material/Close';
import { Window } from '@tauri-apps/api/window';
import { event as tauriEvent } from "@tauri-apps/api";
import tryCatch, { logDebug, logError } from '../index';
import { useTheme } from '@mui/material/styles';
import { filterData, getLabelRows, Keyword } from './utils/validation';
import SearchInput from './components/SearchInput';
import ResultTable from './components/ResultTable';
// Import new configuration system and error handling
import { config, debugLog } from '../../config';
import { handleError } from '../../utils/errorHandling';

const KeywordSearch = () => {
  const theme = useTheme();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [labelInput, setLabelInput] = useState(""); const [activeInput, setActiveInput] = useState<'label' | 'search' | null>(null);
  const [autoDisappearTimer, setAutoDisappearTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeMenu] = useState('search'); const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedLabelInput, setDebouncedLabelInput] = useState(labelInput);
  const [versionInfo, setVersionInfo] = useState<string>("");
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Resize handler to adjust UI for different window sizes
  useEffect(() => {
    const handleResize = () => {
      // No state updates needed - CSS handles responsiveness
      // This is just to force a re-render when window size changes significantly
      if (window.innerWidth > 600) {
        document.documentElement.style.setProperty('--table-cell-width', '20%');
      } else {
        document.documentElement.style.setProperty('--table-cell-width', '20%');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Clear search and label inputs on initial component mount to avoid browser autocomplete
  useEffect(() => {
    // Clear any remembered form values on component mount
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.value = '';
    });

    // Add attribute to help prevent autocomplete in Chrome
    document.querySelectorAll('form').forEach(form => {
      form.setAttribute('autocomplete', 'off');
    });
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLabelInput(labelInput);
    }, 250);
    return () => clearTimeout(handler);
  }, [labelInput]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    // Efficient: split and deduplicate tokens once, then filter in a single call
    const normalized = debouncedSearch
      .normalize('NFD')
      .replace(/[-_,]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase();
    const tokens = Array.from(new Set(normalized.split(/\s+/).filter(Boolean)));
    // Join tokens back to a single string for filterData, or pass as array if filterData supports it
    return filterData(keywords, tokens.join(' '));
  }, [keywords, debouncedSearch]); const labelResult = useMemo(() => {
    if (debouncedLabelInput.trim()) {
      const result = getLabelRows(debouncedLabelInput.trim(), keywords);
      // Ensure all properties match expected types
      return {
        ...result,
        message: typeof result.message === 'string' ? result.message : undefined,
        color: typeof result.color === 'string' ? result.color : undefined,
        consolidatedMessages: result.consolidatedMessages || [],
        // Include the lifecycle state and useInstead information
        lifeCycleState: result.lifeCycleState,
        useInstead: result.useInstead,
        useInsteadAbbrName: result.useInsteadAbbrName
      };
    }
    return null;
  }, [debouncedLabelInput, keywords]);  // Process labelResult for ResultTable component which expects rows as Keyword[]
  const resultTableLabelData = useMemo(() => {
    if (!labelResult) return null;

    // Create a compatible structure for ResultTable that matches the expected Keyword[] type
    return {
      rows: labelResult.rows as unknown as Keyword[],
      message: labelResult.message,
      color: labelResult.color,
      consolidatedMessages: labelResult.consolidatedMessages
    };
  }, [labelResult]);

  const handleMinimize = () => {
    Window.getCurrent().minimize();
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    Window.getCurrent().close();
  };
  useEffect(() => {
    let unlistenClear: (() => void) | undefined;
    let unlistenStore: (() => void) | undefined;
    let unlistenVersion: (() => void) | undefined;

    logDebug("Setting up Tauri event listeners for localStorage operations");

    tauriEvent.listen('keyword-clear-localstorage', () => {
      logDebug("Received keyword-clear-localstorage event");
      tryCatch(() => {
        logDebug("Removing keywords from localStorage with key: " + config.storage.keywordsKey);
        localStorage.removeItem(config.storage.keywordsKey);
        logDebug("Successfully cleared keywords from localStorage");
      }, 'KeywordSearch: clearLocalStorage');
    }).then(
      (fn) => {
        logDebug("Successfully registered keyword-clear-localstorage listener");
        unlistenClear = fn;
      }
    ).catch(error => {
      logError(error, "Failed to set up keyword-clear-localstorage listener");
    });
    tauriEvent.listen<string>('keyword-store-localstorage', (event) => {
      logDebug("Received keyword-store-localstorage event");
      tryCatch(() => {
        if (event.payload) {
          logDebug(`Storing keywords in localStorage with key: ${config.storage.keywordsKey}, data length: ${event.payload.length}`);
          localStorage.setItem(config.storage.keywordsKey, event.payload);

          try {
            const parsed = JSON.parse(event.payload);
            logDebug(`Parsed keywords count: ${parsed.length}`);
            setKeywords(parsed);

            logDebug("Setting loading state to false");
            setLoading(false);
          } catch (error) {
            handleError(error, 'KeywordSearch: parse JSON');
            setLoading(false);
          }
        } else {
          debugLog("Received keyword-store-localstorage event with empty payload");
        }
      }, 'KeywordSearch: storeLocalStorage');
    }).then((fn) => {
      logDebug("Successfully registered keyword-store-localstorage listener");
      unlistenStore = fn;
    }).catch(error => {
      logError(error, "Failed to set up keyword-store-localstorage listener");
    });
    // Listen for offline mode status
    tauriEvent.listen('using-cached-keywords', () => {
      logDebug("Received using-cached-keywords event, setting offline mode");
      setIsOfflineMode(true);

      // If we already have version info, prepend OFFLINE to it
      if (versionInfo && !versionInfo.includes("OFFLINE")) {
        logDebug(`Adding OFFLINE prefix to existing version info: ${versionInfo}`);
        setVersionInfo(`OFFLINE - ${versionInfo}`);
      }
    }).catch(error => {
      logError(error, "Failed to set up using-cached-keywords listener");
    });    // Listen for version info updates
    tauriEvent.listen<string>('version-info', (event) => {
      logDebug("Received version-info event");
      tryCatch(() => {
        if (event.payload) {
          logDebug(`Received version info: ${event.payload}`);

          // Check if this version info already includes OFFLINE prefix
          if (event.payload.includes("OFFLINE")) {
            logDebug("Version info includes OFFLINE prefix");
            setVersionInfo(event.payload);
            setIsOfflineMode(true);
          }
          // If we're already in offline mode, add the prefix if not present
          else if (isOfflineMode && !event.payload.includes("OFFLINE")) {
            logDebug("Already in offline mode, adding OFFLINE prefix");
            setVersionInfo(`OFFLINE - ${event.payload}`);
          }
          // Otherwise, just set the version info as-is
          else {
            setVersionInfo(event.payload);
          }
        }
      }, 'KeywordSearch: handleVersionInfo');
    }).then((fn) => {
      logDebug("Successfully registered version-info listener");
      unlistenVersion = fn;
    }).catch(error => {
      logError(error, "Failed to set up version-info listener");
    });
    return () => {
      logDebug("Cleaning up Tauri event listeners");
      if (unlistenClear) {
        logDebug("Removing keyword-clear-localstorage listener");
        unlistenClear();
      }
      if (unlistenStore) {
        logDebug("Removing keyword-store-localstorage listener");
        unlistenStore();
      }
      if (unlistenVersion) {
        logDebug("Removing version-info listener");
        unlistenVersion();
      }
    };
  }, []);

  useEffect(() => {
    if (autoDisappearTimer) {
      clearTimeout(autoDisappearTimer);
      setAutoDisappearTimer(null);
    }
    return () => {
      if (autoDisappearTimer) clearTimeout(autoDisappearTimer);
    };
  }, [autoDisappearTimer]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;
      if (
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        (e.key.startsWith('F') && e.key.length <= 3)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, []); return (
    <Box
      className="responsive-container"
      sx={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(68, 71, 75, 0.85)' : 'rgba(60, 60, 70, 0.85)'}`,
        borderRadius: 2,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        minWidth: 450,
        minHeight: 300
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          border: `2px solid ${theme.palette.mode === 'dark' ? '#3a4151' : '#b7c2d0'}`,
          borderRadius: 1,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 0 0 1.5px #23243a, 0 2px 16px 0 rgba(30,32,60,0.10)'
            : '0 0 0 1.5px #e3e6f3, 0 2px 16px 0 rgba(120,130,160,0.08)',
          overflow: 'hidden'
        }}
      >        <Box
        className="title-bar"
        sx={{
          height: 30, // Reduced from 38px
          width: '100%',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, rgba(36,38,54,0.92) 0%, rgba(54,58,80,0.96) 100%)'
            : 'linear-gradient(90deg, rgba(235,238,245,0.98) 0%, rgba(220,225,235,0.98) 100%)',
          color: theme.palette.text.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          WebkitAppRegion: 'drag',
          userSelect: 'none',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 2px 12px 0 rgba(30,32,60,0.10)'
            : '0 2px 12px 0 rgba(180,190,200,0.08)',
          transition: 'background 0.3s',
          backdropFilter: 'blur(1.5px)',
          p: 0.1, // Reduced padding
        }}
      >          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <MenuBookIcon sx={{ fontSize: 18, color: theme.palette.mode === 'dark' ? '#e3e6f3' : '#1a237e', ml: 0.8 }} />            <Typography
              className="title-text"
              sx={{ fontSize: 15, fontWeight: 500, p: 0.1, color: theme.palette.mode === 'dark' ? '#e3e6f3' : '#1a237e', lineHeight: 1 }}>
              BBM Label Explorer
            </Typography>
          </Box>          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, WebkitAppRegion: 'no-drag' }}>
            <MinimizeIcon
              onClick={handleMinimize}
              sx={{
                cursor: 'pointer',
                fontSize: 18,
                color: theme.palette.mode === 'dark' ? '#b7c2d0' : '#2d3a4d',
                '&:hover': { color: theme.palette.primary.main },
                transition: 'color 0.2s',
                filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 2px #23243a)' : 'none',
                borderRadius: 1,
                p: 0.1,
                mx: 0.2
              }}
              titleAccess="Minimize"
            />
            <CloseIcon
              onClick={handleClose}
              sx={{
                cursor: 'pointer',
                fontSize: 18,
                color: theme.palette.mode === 'dark' ? '#e57373' : '#b71c1c',
                '&:hover': { color: theme.palette.error.main },
                transition: 'color 0.2s',
                filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 2px #23243a)' : 'none',
                borderRadius: 1,
                p: 0.1,
                mx: 0.2,
                mr: 0.5
              }}
              titleAccess="Close"
            />
          </Box>
        </Box>        <Box sx={{
          p: 0.1,
          width: '100%',
          height: 'calc(100% - 30px)', // Updated to match new title bar height
          background: 'transparent',
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#3a4151' : '#b7c2d0'}`,
        }}>          <Box sx={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          p: 0.5,
          overflowX: 'hidden',
          overflowY: 'auto'
        }}
          className="main-content"
        >
            {activeMenu === 'search' && (<React.Fragment>                <SearchInput
              labelInput={labelInput}
              search={search}
              onLabelInputChange={(value) => {
                setLabelInput(value);
              }} onSearchInputChange={(value) => {
                console.log(`Setting search value: ${value.length} chars`);
                // Ensure we're not limiting the value length here
                setSearch(value);
              }}
              activeInput={activeInput}
              setActiveInput={setActiveInput}
            />{loading ? (<Box sx={{ display: "flex", justifyContent: "center", mt: 1, width: '100%' }}>
              <CircularProgress size={16} />
            </Box>) : (<ResultTable
              data={filtered}
              labelData={resultTableLabelData}
              activeInput={activeInput}
              searchQuery={search}
            />)}
            </React.Fragment>
            )}
            {activeMenu === 'info' && (
              <Box sx={{ width: '100%', maxWidth: 600, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Info</Typography>
                <Typography variant="body2">This is the info section. Add your info content here.</Typography>
              </Box>
            )}          </Box>          {/* Version info display */}
          {versionInfo && (
            <Box
              className="version-info"
            >
              {versionInfo}
            </Box>
          )}
          {/* Debug display - remove this after debugging */}
          <Box className="version-info" sx={{ bottom: '12px', opacity: 0.4 }}>
            Offline: {isOfflineMode ? "true" : "false"}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default KeywordSearch;
