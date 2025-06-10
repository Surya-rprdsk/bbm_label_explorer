import { getToolBehaviorSettings } from '../components/KeywordSearch/utils/storage';

describe('getToolBehaviorSettings', () => {
  const TOOL_BEHAVIOR_KEY = 'settings_tool_behavior';

  beforeEach(() => {
    // @ts-ignore
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('returns default when nothing in localStorage', () => {
    expect(getToolBehaviorSettings()).toEqual({ autoDisappear: false, disappearSeconds: 3 });
  });

  it('returns parsed value from localStorage', () => {
    window.localStorage.setItem(TOOL_BEHAVIOR_KEY, JSON.stringify({ autoDisappear: true, disappearSeconds: 7 }));
    expect(getToolBehaviorSettings()).toEqual({ autoDisappear: true, disappearSeconds: 7 });
  });

  it('returns default if localStorage value is invalid JSON', () => {
    window.localStorage.setItem(TOOL_BEHAVIOR_KEY, '{bad json');
    expect(getToolBehaviorSettings()).toEqual({ autoDisappear: false, disappearSeconds: 3 });
  });
});
