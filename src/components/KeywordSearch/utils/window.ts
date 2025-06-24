import { Window } from '@tauri-apps/api/window';
import { logDebug } from '../../index';

/**
 * Minimizes the main window
 */
export function minimizeMainWindow(): void {
  logDebug('Minimizing main window');
  Window.getCurrent().minimize();
}
