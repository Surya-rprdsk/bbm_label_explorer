export { default as KeywordSearch } from './KeywordSearch/KeywordSearch';
export { default as Settings } from './Settings/Settings';
export { default as SplashScreen } from './SplashScreen/SplashScreen';
import { warn,error } from '@tauri-apps/plugin-log';

// Exception handling and logger utility
export function logError(err: unknown, context?: string) {
  // eslint-disable-next-line no-console
  if (context) {
    console.error(`[bbmle][ERROR] ${context}:`, err);
    error(`${context}: ${String(err)}`);
  } else {
    console.error('[bbmle][ERROR]', err);
    error(String(err));
  }
}

// Debug logging utility - will be stripped in production
export function logDebug(message: string, ...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[bbmle][DEBUG] ${message}`, ...args);
    // debug(message, ...args);
  }
}

// Info logging utility - will be stripped in production
export function logInfo(message: string, ...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[bbmle][INFO] ${message}`, ...args);
    // info(message, ...args);
  }
}

// Warn logging utility - will be stripped in production
export function logWarn(message: string, ...args: any[]) {
    console.warn(`[bbmle][WARN] ${message}`, ...args);
    warn(message, ...args);
}

export default function tryCatch<T>(fn: () => T, context?: string, fallback?: T): T | undefined {
  try {
    const result = fn();
    logDebug(`${context} executed successfully`);
    logInfo(`${context} executed successfully`);
    logWarn(`${context} executed successfully`);
    return result;
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}