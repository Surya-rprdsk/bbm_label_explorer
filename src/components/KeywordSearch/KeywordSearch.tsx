import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import "./KeywordSearch.css";
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
import { tryCatch } from '../index';
import { useTheme } from '@mui/material/styles';
import { filterData, getLabelRows, Keyword } from './utils/validation';
import SearchInput from './components/SearchInput';
import ResultTable from './components/ResultTable';

const KeywordSearch = () => {  const theme = useTheme();
  const [keywords, setKeywords] = useState<Keyword[]>([]);  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [labelInput, setLabelInput] = useState("");
  const [activeInput, setActiveInput] = useState<'label' | 'search' | null>(null);  
  const [autoDisappearTimer, setAutoDisappearTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeMenu] = useState('search');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedLabelInput, setDebouncedLabelInput] = useState(labelInput);
  
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
  }, [keywords, debouncedSearch]);

  const labelResult = useMemo(() => {
    if (debouncedLabelInput.trim()) {
      const result = getLabelRows(debouncedLabelInput.trim(), keywords);
      // Ensure all properties match expected types
      return {
        ...result,
        message: typeof result.message === 'string' ? result.message : undefined,
        color: typeof result.color === 'string' ? result.color : undefined,
        consolidatedMessages: result.consolidatedMessages || []      };
    }
    return null;
  }, [debouncedLabelInput, keywords]);

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
    tauriEvent.listen('keyword-clear-localstorage', () => {
      tryCatch(() => {
        localStorage.removeItem('ubk_keywords');
        console.log('Successfully cleared keywords from local storage');
      }, 'KeywordSearch: clearLocalStorage');
    }).then(
      (fn) => { 
        unlistenClear = fn; 
      }
    ).catch(error => {
      console.error('Failed to set up keyword-clear-localstorage listener:', error);
    });
    tauriEvent.listen<string>('keyword-store-localstorage', (event) => {
      tryCatch(() => {
        if (event.payload) {
          localStorage.setItem('ubk_keywords', event.payload);
          setKeywords(JSON.parse(event.payload));
          setLoading(false);
        }
      }, 'KeywordSearch: storeLocalStorage');
    }).then((fn) => { unlistenStore = fn; });
    return () => {
      if (unlistenClear) unlistenClear();
      if (unlistenStore) unlistenStore();
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
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'transparent',
        border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(68, 71, 75, 0.85)' : 'rgba(60, 60, 70, 0.85)'}`,
        borderRadius: 2,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)'
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: '99vh',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          border: `2px solid ${theme.palette.mode === 'dark' ? '#3a4151' : '#b7c2d0'}`,
          borderRadius: 1,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 0 0 1.5px #23243a, 0 2px 16px 0 rgba(30,32,60,0.10)'
            : '0 0 0 1.5px #e3e6f3, 0 2px 16px 0 rgba(120,130,160,0.08)',
        }}
      >
        <Box
          sx={{
            height: '100%',
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
            p: 0.25,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, minWidth: 0 }}>
            <MenuBookIcon sx={{ fontSize: 26, p: 0.2, color: theme.palette.mode === 'dark' ? '#e3e6f3' : '#1a237e' }} />
            <Typography sx={{ fontSize: 18, fontWeight: 600, p: 0.5, color: theme.palette.mode === 'dark' ? '#e3e6f3' : '#1a237e', lineHeight: 1, mt: 0.2 }}>
              BBM Label Explorer
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, WebkitAppRegion: 'no-drag' }}>
            <MinimizeIcon
              onClick={handleMinimize}
              sx={{
                cursor: 'pointer',
                fontSize: 25,
                color: theme.palette.mode === 'dark' ? '#b7c2d0' : '#2d3a4d',
                '&:hover': { color: theme.palette.primary.main },
                transition: 'color 0.2s',
                filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 2px #23243a)' : 'none',
                borderRadius: 1,
                p: 0.2,
                mx: 0.5,
              }}
              titleAccess="Minimize"
            />
            <CloseIcon
              onClick={handleClose}
              sx={{
                cursor: 'pointer',
                fontSize: 30,
                color: theme.palette.mode === 'dark' ? '#e57373' : '#b71c1c',
                '&:hover': { color: theme.palette.error.main },
                transition: 'color 0.2s',
                filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 2px #23243a)' : 'none',
                borderRadius: 1,
                p: 0.2,
                mx: 0.5,
              }}
              titleAccess="Close"
            />
          </Box>
        </Box>        
        <Box sx={{
          p: 0,
          width: '100%',
          height: 'calc(100% - 40px)',
          background: 'transparent',
          color: theme.palette.text.primary,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          boxSizing: 'border-box',
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#3a4151' : '#b7c2d0'}`,
        }}>
          <Box sx={{ flex: 1, width: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', p: 1 }}>          
            {activeMenu === 'search' && (
              <React.Fragment>                <SearchInput
                  labelInput={labelInput}
                  search={search}
                  onLabelInputChange={(value) => {
                    setLabelInput(value);
                  }}
                  onSearchInputChange={(value) => {
                    setSearch(value);
                  }}
                  activeInput={activeInput}
                  setActiveInput={setActiveInput}
                />
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 1, width: '100%' }}>
                    <CircularProgress size={16} />
                  </Box>                ) : (                  <ResultTable
                    data={filtered}
                    labelData={labelResult}
                    loading={loading}
                    activeInput={activeInput}
                    searchQuery={search}
                  />
                )}
              </React.Fragment>
            )}
            {activeMenu === 'info' && (
              <Box sx={{ width: '100%', maxWidth: 600, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Info</Typography>
                <Typography variant="body2">This is the info section. Add your info content here.</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default KeywordSearch;
