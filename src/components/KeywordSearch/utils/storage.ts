import { Keyword } from './validation';

// Constants moved from constants.ts
const STORAGE_KEY = 'aiLabelAssistKeywords';
const TOOL_BEHAVIOR_KEY = 'aiLabelAssistToolBehavior';

export function getStoredKeywords(): Keyword[] | null {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

export function getToolBehaviorSettings() {
  try {
    const stored = localStorage.getItem(TOOL_BEHAVIOR_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { autoDisappear: false, disappearSeconds: 3 };
}
