export { default as KeywordSearch } from './KeywordSearch/KeywordSearch';
export { default as Settings } from './Settings/Settings';
export { default as SplashScreen } from './SplashScreen/SplashScreen';

// Exception handling and logger utility
export function logError(error: unknown, context?: string) {
  // eslint-disable-next-line no-console
  if (context) {
    console.error(`[AILabelAssist] ${context}:`, error);
  } else {
    console.error('[AILabelAssist]', error);
  }
}

export function tryCatch<T>(fn: () => T, context?: string, fallback?: T): T | undefined {
  try {
    return fn();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}