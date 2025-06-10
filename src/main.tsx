import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './components/KeywordSearch/KeywordSearch.css';
import { extractAndStoreTauriUrls } from './extractTauriUrls';

// Only import @tauri-apps/api/tauri if running in Tauri
let invoke: any = undefined;
if ((window as any).__TAURI__) {
  // @ts-ignore
  invoke = (window as any).__TAURI__.tauri.invoke;
}

function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function setup() {
  // Extract and store Tauri URLs on first boot
  await extractAndStoreTauriUrls();
  // Fake perform some really heavy frontend setup task
  await sleep(1.5);
  // Set the frontend task as being completed
  if (invoke) {
    await invoke('set_complete', { task: 'frontend' });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  setup();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
