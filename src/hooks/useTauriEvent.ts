import { useEffect, useState } from 'react';
import { event as tauriEvent } from '@tauri-apps/api';
import { logDebug, logError } from '../components';

/**
 * Custom hook for subscribing to Tauri events
 * @param eventName The name of the Tauri event to listen for
 * @param callback The callback to run when the event is received
 * @param dependencies Additional dependencies for the effect
 */
export function useTauriEvent<T = any>(
  eventName: string,
  callback: (payload: T) => void,
  dependencies: any[] = []
) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only attempt to set up listeners if we're in a Tauri environment
    if (typeof window === 'undefined' || !(window as any).__TAURI__) {
      return;
    }

    let unlisten: (() => void) | undefined;

    logDebug(`Setting up Tauri event listener for ${eventName}`);
    
    tauriEvent.listen<T>(eventName, (event) => {
      logDebug(`Received ${eventName} event`);
      try {
        callback(event.payload);
      } catch (err) {
        logError(err, `Error in ${eventName} event handler`);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }).then(
      (fn) => {
        unlisten = fn;
        setIsListening(true);
        logDebug(`Successfully registered ${eventName} listener`);
      }
    ).catch(err => {
      setError(err instanceof Error ? err : new Error(String(err)));
      logError(err, `Failed to set up ${eventName} listener`);
    });

    // Clean up the event listener
    return () => {
      if (unlisten) {
        logDebug(`Removing ${eventName} listener`);
        unlisten();
        setIsListening(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, ...dependencies]);

  return { isListening, error };
}
