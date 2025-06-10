// Utility to extract all URLs from config.yaml and store in localStorage on every boot (no cache)
export async function extractAndStoreTauriUrls() {
  // Only run in Tauri
  if (!(window as any).__TAURI__) return;
  const STORAGE_KEY = 'tauri_config_urls';

  let urls: string[] = [];
  try {
    // Use the Tauri JS bridge directly to invoke the backend command
    // @ts-ignore
    const result = await (window as any).__TAURI__.tauri.invoke('get_yaml_config_urls');
    if (Array.isArray(result)) {
      urls = result;
    }
  } catch (e) {
    // fallback: do nothing
  }
  if (urls.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
