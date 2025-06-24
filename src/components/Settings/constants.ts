import { ThemeOption, ToolBehaviorSettings } from './types';
import { config } from '../../config';

// Re-export storage keys from config for backward compatibility
export const STORAGE_KEY = config.storage.apiUrlKey;
export const TOOL_BEHAVIOR_KEY = config.storage.toolBehaviorKey;
export const THEME_KEY = config.storage.themeKey;

export const defaultToolBehavior: ToolBehaviorSettings = {
  autoDisappear: false,
  disappearSeconds: 3,
};

export const themeOptions: ThemeOption[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];