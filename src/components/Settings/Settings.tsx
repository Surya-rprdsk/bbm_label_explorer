import React, { useState, useEffect } from 'react';
import { tryCatch } from '../index';
import { Box, TextField, Button, Typography, Paper, List, ListItemIcon, ListItemButton, ListItem, Checkbox, FormControlLabel, ListItemText } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import LinkIcon from '@mui/icons-material/Link';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

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
  { key: 'urls', label: 'Endpoints', icon: <LinkIcon /> },
  { key: 'tool', label: 'Tool Behaviour', icon: <SettingsIcon /> },
  { key: 'update', label: 'Update', icon: <UpdateIcon /> },
  { key: 'about', label: 'About', icon: <InfoIcon /> },
];

const Settings: React.FC = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [apiUrl2, setApiUrl2] = useState('');
  const [apiUrl3, setApiUrl3] = useState('');
  const [apiUrl4, setApiUrl4] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolBehavior, setToolBehavior] = useState<ToolBehaviorSettings>(defaultToolBehavior);
  const [activeSection, setActiveSection] = useState('urls');
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [checkingUpdate, setCheckingUpdate] = useState<boolean>(false);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setApiUrl(getApiUrl());
    setToolBehavior(getToolBehavior());
    // Load additional URLs from localStorage if present
    setApiUrl2(localStorage.getItem('settings_api_url_2') || '');
    setApiUrl3(localStorage.getItem('settings_api_url_3') || '');
    setApiUrl4(localStorage.getItem('settings_api_url_4') || '');
  }, []);

  const handleSave = () => {
    tryCatch(() => {
      if (!apiUrl) throw new Error('Primary API URL cannot be empty');
      saveApiUrl(apiUrl);
      localStorage.setItem('settings_api_url_2', apiUrl2);
      localStorage.setItem('settings_api_url_3', apiUrl3);
      localStorage.setItem('settings_api_url_4', apiUrl4);
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

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateStatus('Checking for updates...');
    try {
      if ((window as any).__TAURI__ && (window as any).__TAURI__.plugin) {
        await (window as any).__TAURI__.plugin.invoke('plugin:updater|check');
        setUpdateStatus('If an update is available, the updater dialog will appear.');
      } else {
        setUpdateStatus('Updater not available in this environment.');
      }
    } catch (e) {
      setUpdateStatus('Failed to check for updates.');
    }
    setCheckingUpdate(false);
  };

  return (
    <Box
      className="settings-root sidebar-layout settings-compact"
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: isSmall ? 'column' : 'row', md: 'row' },
        width: '100vw',
        minHeight: '100vh',
        background: 'background.default',
        borderRadius: 0,
        boxShadow: 'none',
        overflow: 'hidden',
        '@media (max-width:600px)': {
          minWidth: 320,
          minHeight: 320,
          width: 1,
          height: 1,
        },
      }}
    >
      <Paper
        elevation={2}
        className="settings-sidebar"
        sx={{
          width: { xs: '100%', sm: isSmall ? '100%' : 70, md: 70 },
          minWidth: { xs: 0, sm: 56 },
          maxWidth: { xs: '100%', sm: 120, md: 180, lg: 220 },
          height: { xs: 48, sm: '100vh' },
          background: 'background.paper',
          color: 'text.primary',
          borderRight: { xs: 0, sm: 1 },
          borderBottom: { xs: 1, sm: 0 },
          borderColor: 'divider',
          p: 0,
          display: 'flex',
          flexDirection: { xs: 'row', sm: isSmall ? 'row' : 'column' },
          alignItems: { xs: 'center', sm: isSmall ? 'center' : 'stretch' },
          alignContent: 'center',
          justifyContent: { xs: 'center', sm: isSmall ? 'center' : 'flex-start' },
          transition: 'width 0.2s',
          boxSizing: 'border-box',
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        <List dense sx={{ p: 0, display: 'flex', flexDirection: { xs: 'row', sm: isSmall ? 'row' : 'column' }, width: '100%', height: '100%' }}>
          {SIDEBAR_ITEMS.map(item => (
            <ListItemButton
              key={item.key}
              selected={activeSection === item.key}
              onClick={() => setActiveSection(item.key)}
              sx={{
                minHeight: { xs: 36, sm: 36 },
                px: { xs: 0.5, sm: 1, md: 2 },
                flex: { xs: 1, sm: isSmall ? 1 : undefined },
                justifyContent: 'center',
                borderBottom: { xs: activeSection === item.key ? `2px solid ${theme.palette.primary.main}` : undefined, sm: undefined },
                borderRight: { xs: undefined, sm: !isSmall && activeSection === item.key ? `2px solid ${theme.palette.primary.main}` : undefined },
                borderRadius: 0,
                fontSize: { xs: '0.85em', sm: '0.9em', md: '1em' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28, justifyContent: 'center', color: activeSection === item.key ? 'primary.main' : 'inherit' }}>{item.icon}</ListItemIcon>
            </ListItemButton>
          ))}
        </List>
      </Paper>
      <Paper
        elevation={2}
        className="settings-paper"
        sx={{
          flex: 1,
          minWidth: 0,
          background: 'background.default',
          p: { xs: 1, sm: 2, md: 3 },
          overflowY: 'auto',
          borderRadius: 0,
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          height: { xs: 'calc(100vh - 48px)', sm: '100vh' },
          fontSize: { xs: '0.85em', sm: '0.95em', md: '1em' },
        }}
      >
        <Typography variant="h6" sx={{ fontSize: { xs: '1em', sm: '1.1em' }, mb: 1, textAlign: isSmall ? 'center' : 'left' }}>Settings</Typography>
        {activeSection === 'urls' && (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.95em', sm: '1em' }, mb: 1 }}>API URLs</Typography>
              <TextField
                label="Primary API URL"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                fullWidth
                size="small"
                InputProps={{ autoComplete: 'off', autoSave: 'off', autoCorrect: 'off', spellCheck: false, sx: { fontSize: { xs: '0.85em', sm: '0.95em' }, py: 0.5 } }}
                sx={{ mb: 1, fontSize: { xs: '0.85em', sm: '0.95em' } }}
                helperText="Main endpoint for your API requests."
                FormHelperTextProps={{ sx: { fontSize: { xs: '0.75em', sm: '0.85em' } } }}
              />
              <TextField
                label="Secondary API URL"
                value={apiUrl2}
                onChange={e => setApiUrl2(e.target.value)}
                fullWidth
                size="small"
                InputProps={{ autoComplete: 'off', autoSave: 'off', autoCorrect: 'off', spellCheck: false, sx: { fontSize: { xs: '0.85em', sm: '0.95em' }, py: 0.5 } }}
                sx={{ mb: 1, fontSize: { xs: '0.85em', sm: '0.95em' } }}
                helperText="Backup or alternative endpoint."
                FormHelperTextProps={{ sx: { fontSize: { xs: '0.75em', sm: '0.85em' } } }}
              />
              <TextField
                label="Tertiary API URL"
                value={apiUrl3}
                onChange={e => setApiUrl3(e.target.value)}
                fullWidth
                size="small"
                InputProps={{ autoComplete: 'off', autoSave: 'off', autoCorrect: 'off', spellCheck: false, sx: { fontSize: { xs: '0.85em', sm: '0.95em' }, py: 0.5 } }}
                sx={{ mb: 1, fontSize: { xs: '0.85em', sm: '0.95em' } }}
                helperText="Optional: for testing or staging."
                FormHelperTextProps={{ sx: { fontSize: { xs: '0.75em', sm: '0.85em' } } }}
              />
              <TextField
                label="Quaternary API URL"
                value={apiUrl4}
                onChange={e => setApiUrl4(e.target.value)}
                fullWidth
                size="small"
                InputProps={{ autoComplete: 'off', autoSave: 'off', autoCorrect: 'off', spellCheck: false, sx: { fontSize: { xs: '0.85em', sm: '0.95em' }, py: 0.5 } }}
                sx={{ mb: 1, fontSize: { xs: '0.85em', sm: '0.95em' } }}
                helperText="Optional: for any other endpoint."
                FormHelperTextProps={{ sx: { fontSize: { xs: '0.75em', sm: '0.85em' } } }}
              />
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '0.85em', sm: '0.95em' } }}>Useful Links</Typography>
                <List dense sx={{ fontSize: { xs: '0.85em', sm: '0.95em' }, pl: 2, m: 0 }}>
                  <ListItem disablePadding>
                    <ListItemText primary={<a href="https://docs.example.com" target="_blank" rel="noopener noreferrer">API Documentation</a>} />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText primary={<a href="https://status.example.com" target="_blank" rel="noopener noreferrer">API Status Page</a>} />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText primary={<a href="https://support.example.com" target="_blank" rel="noopener noreferrer">Support Portal</a>} />
                  </ListItem>
                </List>
              </Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSave}
                sx={{ fontSize: { xs: '0.85em', sm: '0.95em' }, minHeight: 32, py: 0.5 }}
              >
                Save
              </Button>
              {saved && <Typography sx={{ fontSize: { xs: '0.75em', sm: '0.85em' }, mt: 0.5 }}>Saved!</Typography>}
              {error && <Typography sx={{ fontSize: { xs: '0.75em', sm: '0.85em' }, mt: 0.5 }}>{error}</Typography>}
            </Box>
          </Box>
        )}
        {activeSection === 'tool' && (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.95em', sm: '1em' }, mb: 1 }}>Tool Behaviour</Typography>
              <Box sx={{ fontSize: { xs: '0.85em', sm: '0.95em' }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={toolBehavior.autoDisappear}
                      onChange={e => handleToolBehaviorChange('autoDisappear', e.target.checked)}
                      sx={{ width: 18, height: 18, p: 0.5 }}
                    />
                  }
                  label="Auto-minimize main window on inactivity"
                  sx={{ fontSize: { xs: '0.85em', sm: '0.95em' }, mr: 2 }}
                />
                <TextField
                  label="Seconds"
                  type="number"
                  size="small"
                  value={toolBehavior.disappearSeconds}
                  onChange={e => handleToolBehaviorChange('disappearSeconds', Math.max(1, Number(e.target.value)))}
                  disabled={!toolBehavior.autoDisappear}
                  inputProps={{ min: 1, style: { fontSize: '0.95em', padding: 2, width: 60 } }}
                  sx={{ ml: 1, fontSize: { xs: '0.85em', sm: '0.95em' }, width: 90 }}
                />
              </Box>
            </Box>
          </Box>
        )}
        {activeSection === 'update' && (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.95em', sm: '1em' }, mb: 1 }}>Update</Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.85em', sm: '0.95em' } }}>Check for updates and manage application version here.</Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2, fontSize: { xs: '0.85em', sm: '0.95em' }, minHeight: 32, py: 0.5 }}
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
              >
                Check for Updates
              </Button>
              {updateStatus && <Typography sx={{ fontSize: { xs: '0.75em', sm: '0.85em' }, mt: 1 }}>{updateStatus}</Typography>}
            </Box>
          </Box>
        )}
        {activeSection === 'about' && (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.95em', sm: '1em' }, mb: 1 }}>About</Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.85em', sm: '0.95em' } }}>AILabelAssist v1.0.0<br/>Copyright © 2025</Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Settings;
