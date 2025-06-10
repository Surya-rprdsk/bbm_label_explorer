import { ThemeOption, ToolBehaviorSettings } from './types';

export const STORAGE_KEY = 'settings_api_url';
export const TOOL_BEHAVIOR_KEY = 'settings_tool_behavior';
export const THEME_KEY = 'settings_theme';

export const defaultToolBehavior: ToolBehaviorSettings = {
  autoDisappear: false,
  disappearSeconds: 3,
};

export const themeOptions: ThemeOption[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];