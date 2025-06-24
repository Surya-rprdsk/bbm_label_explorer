// This file contains type definitions for Tauri API
interface TauriEvent {
  payload: any;
}

interface TauriEventListener {
  listen(event: string, callback: (event: TauriEvent) => void): Promise<() => void>;
}

interface TauriWindow {
  getCurrent(): {
    close(): void;
  };
}

interface TauriApi {
  event: TauriEventListener;
  invoke(command: string, ...args: any[]): Promise<any>;
  window: TauriWindow;
}

declare global {
  interface Window {
    __TAURI__?: TauriApi;
  }
}

export {};
