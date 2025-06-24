import React, { useState, useEffect } from 'react';
import tryCatch from '../index';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItemIcon,
  ListItemButton,
  ListItem,
  Checkbox,
  FormControlLabel,
  ListItemText,
  Drawer,
  AppBar,
  Toolbar,
  CssBaseline,
  useTheme as useMuiTheme,
  Link
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CloseIcon from '@mui/icons-material/Close';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Window } from '@tauri-apps/api/window';
// Import custom hooks
import { useTheme } from '../../hooks';

// Import from modular files
import { ToolBehaviorSettings } from './types';
import { defaultToolBehavior } from './constants';
import {
  getApiUrl,
  saveApiUrl,
  getToolBehavior,
  saveToolBehavior
} from './utils';

const SIDEBAR_ITEMS = [
  { key: 'tool', icon: <SettingsIcon />, label: 'Tool' },
  { key: 'urls', icon: <LinkIcon />, label: 'URLs' },
  { key: 'about', icon: <InfoIcon />, label: 'About' },
];

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  // Use the custom theme hook instead of context
  const { themeMode, setThemeMode } = useTheme();
  const muiTheme = useMuiTheme();
  const [apiUrl, setApiUrl] = useState('');
  const [apiUrl2, setApiUrl2] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolBehavior, setToolBehavior] = useState<ToolBehaviorSettings>(defaultToolBehavior);
  const [activeSection, setActiveSection] = useState('tool');

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    Window.getCurrent().close();
  }; 
  
  useEffect(() => {
    setApiUrl(getApiUrl());
    setToolBehavior(getToolBehavior());
    // Load additional URLs from localStorage if present
    setApiUrl2(localStorage.getItem('settings_api_url_2') || '');
  }, []);
  
  const handleSave = () => {
    tryCatch(() => {
      if (!apiUrl) throw new Error('Primary API URL cannot be empty');
      saveApiUrl(apiUrl);
      localStorage.setItem('settings_api_url_2', apiUrl2);
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 1200);
    }, 'Settings handleSave');
  };

  const handleToolBehaviorChange = (field: keyof ToolBehaviorSettings, value: any) => {
    const updated = { ...toolBehavior, [field]: value };
    setToolBehavior(updated);
    saveToolBehavior(updated);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1200,
          height: 36,
          WebkitAppRegion: 'drag',
          userSelect: 'none',
          background: themeMode === 'dark'
            ? 'linear-gradient(180deg, rgba(40,44,52,0.95) 0%, rgba(33,37,43,0.95) 100%)'
            : 'linear-gradient(180deg, rgba(240,242,245,0.98) 0%, rgba(228,232,235,0.98) 100%)',
          boxShadow: 'none',
          borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}`,
          backdropFilter: 'blur(2px)'
        }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            minHeight: 36,
            px: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
            <MenuBookIcon
              sx={{ fontSize: 20, color: themeMode === 'dark' ? '#c5cae9' : '#3f51b5' }}
            />
            <Typography
              sx={{ fontSize: 13, fontWeight: 500, color: themeMode === 'dark' ? '#c5cae9' : '#3f51b5', lineHeight: 1, fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif' }}
            >
              Settings
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
              WebkitAppRegion: 'no-drag'
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: themeMode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)'
                },
                transition: 'background-color 0.2s'
              }}
            >
              <CloseIcon
                onClick={handleClose}
                sx={{
                  cursor: 'pointer',
                  fontSize: 18,
                  color: themeMode === 'dark' ? '#e57373' : '#d32f2f',
                  '&:hover': { color: muiTheme.palette.error.main },
                  transition: 'color 0.2s'
                }}
                titleAccess="Close"
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: 80,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: 80,
            top: 36,
            height: 'calc(100% - 36px)',
            borderRight: 0,
            background: themeMode === 'dark'
              ? '#22252a'
              : '#f5f6f7',
            boxShadow: 'inset -1px 0 0 rgba(0, 0, 0, 0.08)'
          },
        }}
      >
        <Box sx={{
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>          <List disablePadding>
            {SIDEBAR_ITEMS.map(item => (
              <ListItemButton
                key={item.key}
                selected={activeSection === item.key}
                onClick={() => setActiveSection(item.key)}
                sx={{
                  minHeight: 44,
                  px: 1,
                  py: 1.5,
                  mb: 0.25,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 0.5,
                  transition: 'all 0.1s ease',
                  '&.Mui-selected': {
                    backgroundColor: themeMode === 'dark'
                      ? 'rgba(64, 81, 106, 0.2)'
                      : 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      backgroundColor: themeMode === 'dark'
                        ? 'rgba(64, 81, 106, 0.25)'
                        : 'rgba(25, 118, 210, 0.12)'
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 'auto',
                    color: activeSection === item.key
                      ? muiTheme.palette.primary.main
                      : themeMode === 'dark'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(0, 0, 0, 0.6)',
                    justifyContent: 'center',
                    m: 0
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'caption',
                    sx: {
                      fontSize: '0.7rem',
                      textAlign: 'center',
                      color: activeSection === item.key
                        ? muiTheme.palette.primary.main
                        : themeMode === 'dark'
                          ? 'rgba(255, 255, 255, 0.7)'
                          : 'rgba(0, 0, 0, 0.6)',
                    }
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{
        flexGrow: 1,
        p: 1,
        mt: '36px',
        ml: 0,
        height: 'calc(100% - 36px)',
        width: 'calc(100% - 80px)',
        overflow: 'auto',
        backgroundColor: themeMode === 'dark'
          ? '#2a2d33'
          : '#f8f9fa',
        display: 'flex',
        justifyContent: 'stretch',
        alignItems: 'stretch'
      }}>{activeSection === 'urls' && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            width: '100%',
            height: 'calc(100% - 16px)',
            borderRadius: 1,
            border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
        >            <Typography
          variant="subtitle1"
          sx={{
            mb: 1.5,
            fontWeight: 500,
            fontSize: '14px',
            color: themeMode === 'dark' ? '#e0e0e0' : '#424242',
            borderBottom: `1px solid ${muiTheme.palette.divider}`,
            pb: 0.75,
            fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif'
          }}
        >
            API URLs Configuration
          </Typography>              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2, width: '100%' }}>
            <TextField
              label="Primary API URL"
              placeholder="Enter the main API endpoint URL"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: true,
                sx: {
                  fontWeight: 400,
                  fontSize: '13px',
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif'
                }
              }}
              InputProps={{
                sx: {
                  borderRadius: 0.5,
                  fontSize: '13px',
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.15)'
                  }
                }
              }}
            />              <TextField
              label="Secondary API URL"
              placeholder="Enter the backup API endpoint URL"
              value={apiUrl2}
              onChange={e => setApiUrl2(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              InputLabelProps={{
                shrink: true,
                sx: {
                  fontWeight: 400,
                  fontSize: '13px',
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif'
                }
              }}
              InputProps={{
                sx: {
                  borderRadius: 0.5,
                  fontSize: '13px',
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.15)'
                  }
                }
              }} />
          </Box>

          <Box sx={{ mb: 2, width: '100%', backgroundColor: themeMode === 'dark' ? 'rgba(50, 55, 65, 0.5)' : 'rgba(240, 245, 255, 0.5)', p: 1.5, borderRadius: 1 }}>
            <Typography
              variant="caption"
              sx={{
                mb: 1,
                fontWeight: 600,
                color: muiTheme.palette.primary.main,
                display: 'block'
              }}
            >
              Useful Resources
            </Typography>
            <List dense sx={{ py: 0 }}>
              <ListItem
                disablePadding
                sx={{
                  py: 0.25,
                  px: 0.5,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 24, color: muiTheme.palette.primary.main }}>
                  <MenuBookIcon sx={{ fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Link
                      href="https://docs.example.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: themeMode === 'dark' ? '#90caf9' : '#1565c0',
                        textDecoration: 'none',
                        fontSize: '0.8rem'
                      }}
                    >
                      API Documentation
                    </Link>
                  }
                />
              </ListItem>
              <ListItem
                disablePadding
                sx={{
                  py: 0.25,
                  px: 0.5,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 24, color: muiTheme.palette.info.main }}>
                  <InfoIcon sx={{ fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Link
                      href="https://status.example.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: themeMode === 'dark' ? '#90caf9' : '#1565c0',
                        textDecoration: 'none',
                        fontSize: '0.8rem'
                      }}
                    >
                      API Status Page
                    </Link>
                  }
                />
                
              </ListItem>
              <ListItem
                disablePadding
                sx={{
                  py: 0.25,
                  px: 0.5,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 24, color: muiTheme.palette.action.active }}>
                  <SettingsIcon sx={{ fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Link
                      href="https://support.example.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: themeMode === 'dark' ? '#90caf9' : '#1565c0',
                        textDecoration: 'none',
                        fontSize: '0.8rem'
                      }}
                    >
                      Support Portal
                    </Link>
                  }
                />
                
              </ListItem>
            </List>
          </Box>
          <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', width: '100%' }}>              <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            size="small"
            sx={{
              borderRadius: 0.5,
              textTransform: 'none',
              px: 2,
              py: 0.5,
              boxShadow: 'none',
              fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              '&:hover': {
                boxShadow: 'none'
              }
            }}
          >
            Save Changes
          </Button>
            {saved && (
              <Typography
                variant="caption"
                sx={{
                  ml: 1.5,
                  color: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                ✓ Saved!
              </Typography>
            )}
            {error && (
              <Typography
                variant="caption"
                sx={{
                  ml: 1.5,
                  color: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                ⚠️ {error}
              </Typography>
            )}
          </Box>
        </Paper>)}        {activeSection === 'tool' && (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              width: '100%',
              height: 'calc(100% - 16px)',
              borderRadius: 1,
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 1.5,
                fontWeight: 500,
                fontSize: '14px',
                color: themeMode === 'dark' ? '#e0e0e0' : '#424242',
                borderBottom: `1px solid ${muiTheme.palette.divider}`,
                pb: 0.75,
                fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif'
              }}
            >
              Appearance
            </Typography>
            {/* Theme Switcher */}
            <Box sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 90 }}>
                System Theme
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1,
                  fontSize: '13px',
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  fontWeight: 400
                }}
              >
                {themeMode === 'dark' ? 'Enable Light mode' : 'Enable Dark mode'}
              </Button>
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                mb: 1.5,
                fontWeight: 500,
                fontSize: '14px',
                color: themeMode === 'dark' ? '#e0e0e0' : '#424242',
                borderBottom: `1px solid ${muiTheme.palette.divider}`,
                pb: 0.75,
                fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif'
              }}
            >
              Tool Behavior
            </Typography>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: themeMode === 'dark' ? 'rgba(50, 55, 65, 0.5)' : 'rgba(240, 245, 255, 0.5)',
              p: 1.5,
              borderRadius: 1,
              mb: 1.5,
              width: '100%'
            }}>
              {/* <Typography variant="caption" sx={{ mb: 1, fontWeight: 600, color: muiTheme.palette.primary.main, display: 'block' }}>
                Window Management
              </Typography> */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={toolBehavior.autoDisappear}
                    onChange={e => handleToolBehaviorChange('autoDisappear', e.target.checked)}
                    color="primary"
                    size="small"
                    sx={{
                      padding: 0.5,
                      '& .MuiSvgIcon-root': {
                        fontSize: 18
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{
                    fontWeight: toolBehavior.autoDisappear ? 500 : 400,
                    fontSize: '13px',
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif'
                  }}>
                    Auto-minimize main window on inactivity
                  </Typography>
                }
                sx={{ mb: 0.5 }}
              />
              <Box sx={{
                mt: 0.25,
                ml: 2,
                display: 'flex',
                alignItems: 'center',
                opacity: toolBehavior.autoDisappear ? 1 : 0.5,
                transition: 'opacity 0.2s',
                width: 'calc(100% - 16px)'
              }}>
                <Typography variant="caption" sx={{ mr: 1, minWidth: 60 }}>
                  Timer (sec):
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={toolBehavior.disappearSeconds}
                  onChange={e => handleToolBehaviorChange('disappearSeconds', Math.max(1, Number(e.target.value)))}
                  disabled={!toolBehavior.autoDisappear}
                  inputProps={{ min: 1 }}
                  sx={{ width: 80 }}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      height: 32,
                      fontSize: '0.8rem',
                      borderRadius: 1
                    }
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', width: '100%' }}>              <Button
              variant="contained"
              color="primary"
              onClick={() => {
                saveToolBehavior(toolBehavior);
                setSaved(true);
                setTimeout(() => setSaved(false), 1200);
              }}
              size="small"
              sx={{
                borderRadius: 0.5,
                textTransform: 'none',
                px: 2,
                py: 0.5,
                boxShadow: 'none',
                fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                '&:hover': {
                  boxShadow: 'none'
                }
              }}
            >
              Apply Settings
            </Button>
              {saved && (
                <Typography
                  variant="caption"
                  sx={{
                    ml: 1.5,
                    color: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  ✓ Saved!
                </Typography>
              )}
            </Box>
          </Paper>
        )}       {activeSection === 'about' && (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                width: '100%',
                height: 'calc(100% - 16px)',
                borderRadius: 1,
                border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: 'none',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 1.5,
                  fontWeight: 500,
                  fontSize: '14px',
                  color: themeMode === 'dark' ? '#e0e0e0' : '#424242',
                  borderBottom: `1px solid ${muiTheme.palette.divider}`,
                  pb: 0.75,
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif'
                }}
              >
                About
              </Typography>              <Box sx={{
                backgroundColor: themeMode === 'dark' ? 'rgba(50, 55, 65, 0.5)' : 'rgba(240, 245, 255, 0.5)',
                p: 1.5,
                borderRadius: 1,
                mb: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
              }}>
                
                <MenuBookIcon sx={{ fontSize: 48, mb: 1.5, color: muiTheme.palette.primary.main }} />

                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  BBM Label Explorer
                </Typography>

                <Typography variant="caption" sx={{ mb: 2, fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif' }}>
                  Version 1.0.0
                </Typography>            </Box>


              <Box sx={{ mb: 2, width: '100%', backgroundColor: themeMode === 'dark' ? 'rgba(50, 55, 65, 0.5)' : 'rgba(240, 245, 255, 0.5)', p: 1.5, borderRadius: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: muiTheme.palette.primary.main,
                    display: 'block'
                  }}
                >
                  Support & Resources
                </Typography>
                <List dense sx={{ py: 0 }}>
                  <ListItem
                    disablePadding
                    sx={{
                      py: 0.25,
                      px: 0.5,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 24, color: muiTheme.palette.info.main }}>
                      <InfoIcon sx={{ fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          style={{
                            color: themeMode === 'dark' ? '#e0e0e0' : '#424242',
                            fontSize: '0.8rem',
                            fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif'
                          }}
                        >
                          User Documentation
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>            </Box>
              
            </Paper>
          )}
      </Box>
    </Box>
  );
};

export default Settings;
