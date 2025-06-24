import { ToolBehaviorSettings } from '../types';
import { defaultToolBehavior } from '../constants';
import { config, storage, debugLog } from '../../../config';
import { createStorageError, ErrorSeverity, handleError } from '../../../utils/errorHandling';

/**
 * Get the API URL from localStorage
 */
export const getApiUrl = (): string => {
  debugLog('Retrieving API URL from localStorage with key:', config.storage.apiUrlKey);
  const storedApiUrl = localStorage.getItem(config.storage.apiUrlKey);
  if (storedApiUrl) {
    debugLog('Successfully retrieved API URL from localStorage:', storedApiUrl);
  } else {
    debugLog('No API URL found in localStorage');
  }
  return storedApiUrl || '';
};

/**
 * Save the API URL to localStorage and Tauri backend if available
 */
export const saveApiUrl = (apiUrl: string): void => {
  debugLog('Saving API URL to localStorage with key:', config.storage.apiUrlKey, 'value:', apiUrl);
  
  try {
    localStorage.setItem(config.storage.apiUrlKey, apiUrl);
    
    // Also save to Tauri backend if available
    if (window.__TAURI__ && window.__TAURI__.tauri) {
      debugLog('Invoking Tauri backend to save API URL');
      window.__TAURI__.tauri.invoke('save_settings_api_url', { url: apiUrl })
        .then(() => {
          debugLog('Successfully saved API URL to Tauri backend');
        })
        .catch((err: any) => {
          handleError(err, 'Settings: save API URL to Tauri backend');
        });
    }
  } catch (error) {
    handleError(
      createStorageError(
        'Failed to save API URL to localStorage',
        ErrorSeverity.ERROR,
        error instanceof Error ? error : undefined
      ),
      'Settings: save API URL'
    );
  }
};

/**
 * Get tool behavior settings from localStorage
 */
export const getToolBehavior = (): ToolBehaviorSettings => {
  debugLog('Retrieving tool behavior settings from localStorage with key:', config.storage.toolBehaviorKey);
  
  return storage.get(config.storage.toolBehaviorKey, { ...defaultToolBehavior });
};

/**
 * Save tool behavior settings to localStorage
 */
export const saveToolBehavior = (toolBehavior: ToolBehaviorSettings): void => {
  debugLog('Saving tool behavior settings to localStorage with key:', config.storage.toolBehaviorKey, 'value:', toolBehavior);
  
  if (!storage.set(config.storage.toolBehaviorKey, toolBehavior)) {
    handleError(
      createStorageError(
        'Failed to save tool behavior settings to localStorage',
        ErrorSeverity.WARNING
      ),
      'Settings: save tool behavior'
    );
  }
};