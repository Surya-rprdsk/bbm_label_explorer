/**
 * Configuration system for BBM Label Explorer
 * Provides centralized management of application settings with environment-specific configurations
 */

// Environment type definition
type Environment = 'development' | 'production';

// Determine current environment
const ENV: Environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

// Define base configuration structure
interface Config {
  apiBaseUrl: string;
  endpoints: {
    keywords: string;
    versions: string;
  };
  timeouts: {
    apiRequest: number; // in milliseconds
    loading: number; // in milliseconds
  };
  retries: {
    maxAttempts: number;
    delayMs: number; // base delay in milliseconds
  };
  storage: {
    keywordsKey: string;
    settingsKey: string;
    apiUrlKey: string;
    apiUrlBackupKey: string;
    toolBehaviorKey: string;
    themeKey: string;
    windowPositionKey: string;
    tauriConfigUrlsKey: string;
  };
  debug: boolean;
}

// Development environment configuration
const DEV_CONFIG: Config = {
  apiBaseUrl: "https://si0vmc0854.de.bosch.com/swap-prod/api",
  endpoints: {
    keywords: "/ubk-keywords",
    versions: "/versions/bbm-keywords"
  },
  timeouts: {
    apiRequest: 30000, // 30 seconds
    loading: 15000, // 15 seconds
  },
  retries: {
    maxAttempts: 3,
    delayMs: 1000, // 1 second
  },
  storage: {
    keywordsKey: 'ubk_keywords',
    settingsKey: 'bbm_label_explorer_settings',
    apiUrlKey: 'settings_api_url',
    apiUrlBackupKey: 'settings_api_url_2',
    toolBehaviorKey: 'settings_tool_behavior',
    themeKey: 'settings_theme',
    windowPositionKey: 'window_position',
    tauriConfigUrlsKey: 'tauri_config_urls',
  },
  debug: true,
};

// Production environment configuration
const PROD_CONFIG: Config = {
  ...DEV_CONFIG, // inherit from development configuration
  debug: false, // disable debug in production
};

// Export the correct configuration based on environment
export const config: Config = ENV === 'production' ? PROD_CONFIG : DEV_CONFIG;

/**
 * Helper function to get the full API URL for a specific endpoint
 * @param endpoint - The endpoint name as defined in config.endpoints
 * @returns The complete API URL
 */
export function getApiUrl(endpoint: keyof typeof config.endpoints): string {
  return `${config.apiBaseUrl}${config.endpoints[endpoint]}`;
}

/**
 * Helper function to get a custom API URL from localStorage, falling back to the config
 * @param endpoint - The endpoint name as defined in config.endpoints
 * @returns The complete API URL from localStorage or config
 */
export function getApiUrlWithFallback(endpoint: keyof typeof config.endpoints): string {
  const storedApiUrl = localStorage.getItem(config.storage.apiUrlKey);
  
  if (storedApiUrl && storedApiUrl.trim()) {
    return storedApiUrl;
  }
  
  return getApiUrl(endpoint);
}

/**
 * Helper function to get the backup API URL from localStorage
 * @returns The backup API URL or empty string if not set
 */
export function getBackupApiUrl(): string {
  return localStorage.getItem(config.storage.apiUrlBackupKey) || '';
}

/**
 * Helper function to check if debugging is enabled
 * @returns True if debugging is enabled
 */
export function isDebugEnabled(): boolean {
  return config.debug;
}

/**
 * Helper function to log debug messages (only in debug mode)
 * @param message - The message to log
 * @param optionalParams - Additional parameters to log
 */
export function debugLog(message: string, ...optionalParams: any[]): void {
  if (isDebugEnabled()) {
    console.log(`[BBMLE][DEBUG] ${message}`, ...optionalParams);
  }
}

/**
 * Helper function to manage storage operations with error handling
 */
export const storage = {
  /**
   * Get an item from localStorage with error handling
   * @param key - The storage key
   * @param defaultValue - Default value if key doesn't exist or on error
   * @returns The stored value or defaultValue
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value) as T;
    } catch (error) {
      debugLog(`Error getting item from localStorage: ${error}`);
      return defaultValue;
    }
  },

  /**
   * Set an item in localStorage with error handling
   * @param key - The storage key
   * @param value - The value to store
   * @returns True if successful, false otherwise
   */
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      debugLog(`Error setting item in localStorage: ${error}`);
      return false;
    }
  },

  /**
   * Remove an item from localStorage with error handling
   * @param key - The storage key
   * @returns True if successful, false otherwise
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      debugLog(`Error removing item from localStorage: ${error}`);
      return false;
    }
  }
};