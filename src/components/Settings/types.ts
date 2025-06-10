export interface ToolBehaviorSettings {
  autoDisappear: boolean;
  disappearSeconds: number;
}

export interface ThemeOption {
  label: string;
  value: ThemeValue;
}

export type ThemeValue = 'system' | 'light' | 'dark';