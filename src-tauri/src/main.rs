// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use reqwest;
use serde_json::Value;
use serde_yaml::Value as YamlValue;
use std::fs;
use std::sync::{Arc, Mutex};
use sysinfo::System;
use tauri::async_runtime::spawn;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;
use tauri::WebviewWindowBuilder;
use tauri::{AppHandle, Emitter, State};
use tauri_utils::config::WebviewUrl;

struct SetupState {
    frontend_task: bool,
    backend_task: bool,
}

#[tauri::command]
async fn set_complete(
    app: AppHandle,
    state: State<'_, Arc<Mutex<SetupState>>>,
    task: String,
) -> Result<(), ()> {
    let mut state_lock = state.lock().unwrap();
    match task.as_str() {
        "frontend" => state_lock.frontend_task = true,
        "backend" => state_lock.backend_task = true,
        _ => panic!("invalid task completed!"),
    }
    if state_lock.backend_task && state_lock.frontend_task {
        let splash_window = app.get_webview_window("splashscreen").unwrap();
        let main_window = app.get_webview_window("main").unwrap();
        splash_window.close().unwrap();
        // Move main window to right bottom before showing
        if let Ok(monitor) = main_window.current_monitor() {
            if let Some(monitor) = monitor {
                let monitor_size = monitor.size();
                let window_size = main_window.outer_size().unwrap();
                let x = monitor_size.width as i32 - window_size.width as i32;
                let taskbar_height = 40; // Height in pixels to offset above the taskbar
                let y = monitor_size.height as i32 - window_size.height as i32 - taskbar_height;
                let _ = main_window.set_position(tauri::PhysicalPosition { x, y });
            }
        }
        main_window.show().unwrap();
    }
    Ok(())
}

// Fix: avoid moving State into async task, use Arc<Mutex<SetupState>>
#[tauri::command]
async fn start_keyword_loading(
    app: AppHandle,
    state: State<'_, Arc<Mutex<SetupState>>>,
) -> Result<(), ()> {
    let app_handle = app.clone();
    let state_arc = state.inner().clone();
    spawn(async move {
        // Always get API URL from config.yaml, no fallback to hardcoded value
        let api_url = {
            if let Ok(current_dir) = std::env::current_dir() {
                let config_path = current_dir.join("src-tauri").join("../config.yaml");
                if let Ok(contents) = std::fs::read_to_string(&config_path) {
                    if let Ok(yaml) = serde_yaml::from_str::<YamlValue>(&contents) {
                        if let Some(api_url) = yaml.get("api_url").and_then(|v| v.as_str()) {
                            api_url.to_string()
                        } else {
                            panic!("api_url not found in config.yaml or config.yaml missing");
                        }
                    } else {
                        panic!("config.yaml is not valid YAML");
                    }
                } else {
                    panic!("config.yaml missing");
                }
            } else {
                panic!("Could not determine current_dir");
            }
        };
        let client = reqwest::Client::new();
        // Show numeric progress before and during fetch
        for progress in (0..=100).step_by(10) {
            app_handle.emit("keyword-loading-progress", progress).ok();
            // Give the UI time to update
            tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
        }
        app_handle
            .emit(
                "keyword-loading-progress",
                "Fetching keywords from server...",
            )
            .ok();
        // Clear localStorage before fetching new data
        app_handle.emit("keyword-clear-localstorage", ()).ok();
        let response = match client.get(&api_url).send().await {
            Ok(resp) => {
                println!("[Rust] API call succeeded: {}", api_url);
                resp
            }
            Err(e) => {
                println!("[Rust] API call failed: {} - {}", api_url, e);
                app_handle
                    .emit("keyword-loading-progress", "Failed to fetch keywords")
                    .ok();
                return ();
            }
        };
        // Use response.bytes() in a loop for progress
        let total_size = response.content_length().unwrap_or(0);
        println!("[Rust] Content-Length: {} bytes", total_size);
        let stream = response;
        // To print number of entries, buffer the full body and parse JSON
        let body = match stream.bytes().await {
            Ok(bytes) => bytes,
            Err(e) => {
                println!("[Rust] Failed to read response body: {}", e);
                return;
            }
        };
        match serde_json::from_slice::<serde_json::Value>(&body) {
            Ok(json) => {
                if let Some(arr) = json.as_array() {
                    println!("[Rust] JSON entries: {}", arr.len());
                    // Store the array in localStorage via frontend event
                    app_handle
                        .emit(
                            "keyword-store-localstorage",
                            serde_json::to_string(&arr).unwrap(),
                        )
                        .ok();
                } else {
                    println!("[Rust] JSON is not an array");
                }
            }
            Err(e) => println!("[Rust] Failed to parse JSON: {}", e),
        }
        app_handle
            .emit("keyword-loading-progress", "Parsing keywords...")
            .ok();
        // Simulate parsing
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        app_handle.emit("keyword-loading-progress", "done").ok();
        // Directly update state and handle splash/main window logic
        let mut state_lock = state_arc.lock().unwrap();
        state_lock.backend_task = true;
        // Immediately close splash and show main window after keywords are loaded
        let splash_window = app_handle.get_webview_window("splashscreen").unwrap();
        let main_window = app_handle.get_webview_window("main").unwrap();
        splash_window.close().unwrap();
        // Move main window to right bottom before showing
        if let Ok(monitor) = main_window.current_monitor() {
            if let Some(monitor) = monitor {
                let monitor_size = monitor.size();
                let window_size = main_window.outer_size().unwrap();
                let x = monitor_size.width as i32 - window_size.width as i32;
                let taskbar_height = 40; // Height in pixels to offset above the taskbar
                let y = monitor_size.height as i32 - window_size.height as i32 - taskbar_height;
                let _ = main_window.set_position(tauri::PhysicalPosition { x, y });
            }
        }
        main_window.show().unwrap();
    });
    Ok(())
}

#[tauri::command]
fn save_settings_api_url(url: String, app: AppHandle) {
    use std::fs;
    if let Ok(dir) = app.path().app_local_data_dir() {
        let path = dir.join("settings_api_url.txt");
        let _ = fs::write(path, url);
    }
}

#[tauri::command]
fn get_tauri_config_urls(_app: AppHandle) -> Vec<String> {
    let mut urls = Vec::new();
    // Try to read tauri.conf.json
    if let Ok(current_dir) = std::env::current_dir() {
        let config_path = current_dir.join("src-tauri").join("tauri.conf.json");
        if let Ok(contents) = fs::read_to_string(&config_path) {
            if let Ok(json) = serde_json::from_str::<Value>(&contents) {
                // Recursively extract all string values that look like URLs
                fn extract_urls(val: &Value, urls: &mut Vec<String>) {
                    match val {
                        Value::String(s) => {
                            if s.starts_with("http://")
                                || s.starts_with("https://")
                                || s.starts_with("/")
                                || s.ends_with(".html")
                            {
                                urls.push(s.clone());
                            }
                        }
                        Value::Array(arr) => {
                            for v in arr {
                                extract_urls(v, urls);
                            }
                        }
                        Value::Object(map) => {
                            for v in map.values() {
                                extract_urls(v, urls);
                            }
                        }
                        _ => {}
                    }
                }
                extract_urls(&json, &mut urls);
            }
        }
    }
    urls
}

#[tauri::command]
fn get_yaml_config_urls() -> Vec<String> {
    let mut urls = Vec::new();
    // Read config.yaml from src-tauri
    if let Ok(current_dir) = std::env::current_dir() {
        let config_path = current_dir.join("src-tauri").join("config.yaml");
        if let Ok(contents) = std::fs::read_to_string(&config_path) {
            if let Ok(yaml) = serde_yaml::from_str::<YamlValue>(&contents) {
                // Recursively extract all string values that look like URLs or .html
                fn extract_urls(val: &YamlValue, urls: &mut Vec<String>) {
                    match val {
                        YamlValue::String(s) => {
                            if s.starts_with("http://")
                                || s.starts_with("https://")
                                || s.starts_with("/")
                                || s.ends_with(".html")
                            {
                                urls.push(s.clone());
                            }
                        }
                        YamlValue::Sequence(arr) => {
                            for v in arr {
                                extract_urls(v, urls);
                            }
                        }
                        YamlValue::Mapping(map) => {
                            for v in map.values() {
                                extract_urls(v, urls);
                            }
                        }
                        _ => {}
                    }
                }
                extract_urls(&yaml, &mut urls);
            }
        }
    }
    urls
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Arc::new(Mutex::new(SetupState {
            frontend_task: false,
            backend_task: false,
        })))
        .invoke_handler(tauri::generate_handler![
            set_complete,
            start_keyword_loading,
            get_system_memory,
            save_settings_api_url,
            get_tauri_config_urls,
            get_yaml_config_urls
        ])
        .setup(|app| {
            let quit = MenuItemBuilder::new("Quit").id("quit").build(app).unwrap();
            let settings = MenuItemBuilder::new("Settings")
                .id("settings")
                .build(app)
                .unwrap();
            let menu = MenuBuilder::new(app)
                .items(&[&quit, &settings])
                .build()
                .unwrap();
            let _ = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => app.exit(0),
                    "settings" => {
                        dbg!("settings menu clicked");
                        // Try to get the settings window
                        if let Some(window) = app.get_webview_window("settings") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        } else {
                            // If the settings window does not exist, create it
                            let _ = WebviewWindowBuilder::new(
                                app,
                                "settings",
                                WebviewUrl::App("/settings.html".into()),
                            )
                            .title("Settings")
                            .decorations(true)
                            .center()
                            .build();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray_icon, event| match event {
                    tauri::tray::TrayIconEvent::Click { button, .. } => {
                        if button == tauri::tray::MouseButton::Left {
                            dbg!("system tray received a left click");
                            if let Some(window) = tray_icon.app_handle().get_webview_window("main")
                            {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    _ => {}
                })
                .build(app);

            let app_handle = app.handle().clone();
            let state = app.state::<Arc<Mutex<SetupState>>>();
            // Start backend loading (await, since setup is sync)
            tauri::async_runtime::block_on(start_keyword_loading(app_handle, state)).ok();
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_system_memory() -> String {
    println!("I was invoked from JS!");
    let mut sys = System::new_all();

    // First we update all information of our `System` struct.
    sys.refresh_all();

    println!("total memory: {} KB", sys.total_memory());
    println!("used memory : {} KB", sys.used_memory());
    sys.used_memory().to_string()
}
