import { config, debugLog, storage } from './config';
import { createApiError, ErrorSeverity, handleError, withRetry } from './utils/errorHandling';

// Utility to extract all URLs from hardcoded values in the backend and store in localStorage on every boot (no cache)
export async function extractAndStoreTauriUrls() {
  // Only run in Tauri
  if (!(window as any).__TAURI__) return;

  try {
    const urls = await withRetry(
      async () => {
        debugLog('Fetching app config URLs from Tauri backend');
        // Use the Tauri JS bridge directly to invoke the backend command
        // @ts-ignore
        const result = await (window as any).__TAURI__.tauri.invoke('get_app_config_urls');
        
        if (Array.isArray(result) && result.length > 0) {
          debugLog(`Retrieved ${result.length} URLs from Tauri backend`);
          return result;
        }
        
        throw createApiError(
          'Failed to retrieve valid URLs from Tauri backend',
          undefined,
          ErrorSeverity.WARNING
        );
      },
      config.retries.maxAttempts,
      config.retries.delayMs,
      (attempt, error) => {
        debugLog(`Retry attempt ${attempt} for get_app_config_urls: ${error.message}`);
      }
    );

    // Store URLs in localStorage
    if (urls.length > 0) {
      storage.set(config.storage.tauriConfigUrlsKey, urls);
      debugLog(`Stored ${urls.length} URLs in localStorage`);
    }
  } catch (error) {
    // If all retries fail, use default hardcoded values as fallback
    const fallbackUrls = [
      "https://si0vmc0854.de.bosch.com/swap-prod/api/ubk-keywords",
      "/index.html",
      "/settings.html"
    ];
    
    storage.set(config.storage.tauriConfigUrlsKey, fallbackUrls);
    debugLog('Using fallback URLs due to failure to retrieve from backend');
    
    handleError(error, 'extractTauriUrls');
  }
}
