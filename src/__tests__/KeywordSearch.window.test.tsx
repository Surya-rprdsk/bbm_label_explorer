import { render, act } from '@testing-library/react';
import React from 'react';
import * as windowUtils from '../components/KeywordSearch/utils/window';
import * as storageUtils from '../components/KeywordSearch/utils/storage';
import KeywordSearch from '../components/KeywordSearch/KeywordSearch';

jest.useFakeTimers();

describe('KeywordSearch - auto-minimize on focus loss', () => {
  let minimizeSpy: jest.SpyInstance;
  let getToolBehaviorSettingsSpy: jest.SpyInstance;
  let originalHasFocus: any;

  beforeEach(() => {
    minimizeSpy = jest.spyOn(windowUtils, 'minimizeMainWindow').mockImplementation(() => {});
    getToolBehaviorSettingsSpy = jest.spyOn(storageUtils, 'getToolBehaviorSettings');
    originalHasFocus = Object.getOwnPropertyDescriptor(document, 'hasFocus');
  });

  afterEach(() => {
    minimizeSpy.mockRestore();
    getToolBehaviorSettingsSpy.mockRestore();
    if (originalHasFocus) {
      Object.defineProperty(document, 'hasFocus', originalHasFocus);
    }
    jest.clearAllTimers();
  });

  function setHasFocus(val: boolean) {
    Object.defineProperty(document, 'hasFocus', {
      configurable: true,
      value: () => val,
    });
  }

  it('should not minimize if autoDisappear is false', () => {
    getToolBehaviorSettingsSpy.mockReturnValue({ autoDisappear: false, disappearSeconds: 2 });
    render(<KeywordSearch />);
    window.dispatchEvent(new Event('blur'));
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(minimizeSpy).not.toHaveBeenCalled();
  });

  it('should minimize if focus is lost for configured time', () => {
    getToolBehaviorSettingsSpy.mockReturnValue({ autoDisappear: true, disappearSeconds: 2 });
    render(<KeywordSearch />);
    setHasFocus(false);
    window.dispatchEvent(new Event('blur'));
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(minimizeSpy).toHaveBeenCalled();
  });

  it('should not minimize if focus is regained before timer expires', () => {
    getToolBehaviorSettingsSpy.mockReturnValue({ autoDisappear: true, disappearSeconds: 2 });
    render(<KeywordSearch />);
    setHasFocus(false);
    window.dispatchEvent(new Event('blur'));
    act(() => {
      jest.advanceTimersByTime(1000);
      window.dispatchEvent(new Event('focus'));
      jest.advanceTimersByTime(2000);
    });
    expect(minimizeSpy).not.toHaveBeenCalled();
  });

  it('should not minimize if focus is regained right before timer expires', () => {
    getToolBehaviorSettingsSpy.mockReturnValue({ autoDisappear: true, disappearSeconds: 2 });
    render(<KeywordSearch />);
    setHasFocus(false);
    window.dispatchEvent(new Event('blur'));
    act(() => {
      jest.advanceTimersByTime(1900);
      setHasFocus(true);
      window.dispatchEvent(new Event('focus'));
      jest.advanceTimersByTime(200);
    });
    expect(minimizeSpy).not.toHaveBeenCalled();
  });

  it('should only minimize if focus is still lost after timer', () => {
    getToolBehaviorSettingsSpy.mockReturnValue({ autoDisappear: true, disappearSeconds: 2 });
    render(<KeywordSearch />);
    setHasFocus(false);
    window.dispatchEvent(new Event('blur'));
    act(() => {
      jest.advanceTimersByTime(1000);
      setHasFocus(true);
      window.dispatchEvent(new Event('focus'));
      setHasFocus(false);
      window.dispatchEvent(new Event('blur'));
      jest.advanceTimersByTime(2000);
    });
    expect(minimizeSpy).toHaveBeenCalledTimes(1);
  });
});
