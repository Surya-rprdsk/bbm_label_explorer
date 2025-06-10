import { ToolBehaviorSettings } from '../types';
import { STORAGE_KEY, TOOL_BEHAVIOR_KEY, defaultToolBehavior } from '../constants';

/**
 * Get the API URL from localStorage
 */
export const getApiUrl = (): string => {
  const storedApiUrl = localStorage.getItem(STORAGE_KEY);
  return storedApiUrl || '';
};

/**
 * Save the API URL to localStorage and Tauri backend if available
 */
export const saveApiUrl = (apiUrl: string): void => {
  localStorage.setItem(STORAGE_KEY, apiUrl);
  
  // Also save to Tauri backend if available
  if (window.__TAURI__ && window.__TAURI__.tauri) {
    window.__TAURI__.tauri.invoke('save_settings_api_url', { url: apiUrl });
  }
};

/**
 * Get tool behavior settings from localStorage
 */
export const getToolBehavior = (): ToolBehaviorSettings => {
  const storedToolBehavior = localStorage.getItem(TOOL_BEHAVIOR_KEY);
  if (storedToolBehavior) {
    try {
      return JSON.parse(storedToolBehavior);
    } catch {
      return { ...defaultToolBehavior };
    }
  }
  return { ...defaultToolBehavior };
};

/**
 * Save tool behavior settings to localStorage
 */
export const saveToolBehavior = (toolBehavior: ToolBehaviorSettings): void => {
  localStorage.setItem(TOOL_BEHAVIOR_KEY, JSON.stringify(toolBehavior));
};