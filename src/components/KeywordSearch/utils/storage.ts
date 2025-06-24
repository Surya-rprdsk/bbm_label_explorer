import { Keyword } from './validation';
import { config, storage, debugLog } from '../../../config';
import { createStorageError, ErrorSeverity } from '../../../utils/errorHandling';

/**
 * Get stored keywords from localStorage
 * @returns Array of keywords or null if not found
 * @throws StorageError if there's an issue retrieving keywords
 */
export function getStoredKeywords(): Keyword[] | null {
  try {
    debugLog('Retrieving keywords from localStorage');
    const data = localStorage.getItem(config.storage.keywordsKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    const errorMessage = 'Failed to retrieve keywords from localStorage';
    console.error(`[AILabelAssist][ERROR] ${errorMessage}:`, error);
    throw createStorageError(
      errorMessage,
      ErrorSeverity.ERROR,
      error instanceof Error ? error : undefined
    );
  }
}

export function getToolBehaviorSettings() {
  return storage.get(config.storage.toolBehaviorKey, { 
    autoDisappear: false, 
    disappearSeconds: 3 
  });
}

export function saveToolBehaviorSettings(settings: { autoDisappear: boolean, disappearSeconds: number }) {
  return storage.set(config.storage.toolBehaviorKey, settings);
}
