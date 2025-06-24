// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use reqwest;
use serde_json::Value;
use std::fs;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use sysinfo::System;
use tauri::WebviewWindowBuilder;
use tauri::async_runtime::spawn;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_log;

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
    let start = Instant::now();
    log::info!("Task completion reported: {}", task);
    let mut state_lock = state.lock().unwrap();
    match task.as_str() {
        "frontend" => {
            log::info!("Frontend initialization completed");
            state_lock.frontend_task = true;
        }
        "backend" => {
            log::info!("Backend initialization completed");
            state_lock.backend_task = true;
        }
        _ => {
            log::error!("Invalid task completion reported: {}", task);
            panic!("invalid task completed!");
        }
    }
    log::debug!(
        "State after set_complete: frontend_task={}, backend_task={}",
        state_lock.frontend_task,
        state_lock.backend_task
    );
    if state_lock.backend_task && state_lock.frontend_task {
        log::info!("All initialization tasks completed, transitioning from splash to main window");
        let splash_window = app.get_webview_window("splashscreen").unwrap();
        let main_window = app.get_webview_window("main").unwrap();
        splash_window.close().unwrap();
        // Move main window to right bottom before showing
        if let Ok(monitor) = main_window.current_monitor() {
            if let Some(monitor) = monitor {
                log::info!("Positioning main window at bottom-right corner of screen");
                let monitor_size = monitor.size();
                let window_size = main_window.outer_size().unwrap();
                let x = monitor_size.width as i32 - window_size.width as i32;
                let taskbar_height = 40; // Height in pixels to offset above the taskbar
                let y = monitor_size.height as i32 - window_size.height as i32 - taskbar_height;
                log::debug!(
                    "Window position: x={}, y={}, monitor size: {}x{}, window size: {}x{}",
                    x,
                    y,
                    monitor_size.width,
                    monitor_size.height,
                    window_size.width,
                    window_size.height
                );
                let _ = main_window.set_position(tauri::PhysicalPosition { x, y });
            } else {
                log::warn!("Failed to get monitor information for window positioning");
            }
        } else {
            log::warn!("Failed to get current monitor for window positioning");
        }
        log::info!("Showing main window");
        main_window.show().unwrap();
    }
    log::debug!("set_complete finished in {:?}", start.elapsed());
    Ok(())
}

// Fix: avoid moving State into async task, use Arc<Mutex<SetupState>>
#[tauri::command]
async fn start_keyword_loading(
    app: AppHandle,
    state: State<'_, Arc<Mutex<SetupState>>>,
) -> Result<(), ()> {
    let start = Instant::now();
    log::info!("start_keyword_loading called");

    // Send initial progress message to ensure the loading bar is visible
    app.emit("keyword-loading-progress", "Initializing...").ok();

    let app_handle = app.clone();
    let state_arc = state.inner().clone();
    spawn(async move {
        log::debug!("Keyword loading background task started");
        // Hardcoded API URL - no config file needed
        let api_url = "https://si0vmc0854.de.bosch.com/swap-prod/api/ubk-keywords".to_string();

        // Try to load keywords from local storage first
        let mut use_local_file = false;
        let mut local_json_data = None;
        if let Ok(app_data_dir) = app_handle.path().app_local_data_dir() {
            let json_path = app_data_dir.join("keywords.json");
            log::info!("Checking for cached keywords at {}", json_path.display());
            if json_path.exists() {
                match fs::read_to_string(&json_path) {
                    Ok(json_string) => {
                        match serde_json::from_str::<serde_json::Value>(&json_string) {
                            Ok(json) => {
                                if let Some(arr) = json.as_array() {
                                    log::info!("Found cached keywords with {} entries", arr.len());
                                    local_json_data = Some(json);
                                    use_local_file = true;

                                    // Show loading from cache progress
                                    app_handle
                                        .emit(
                                            "keyword-loading-progress",
                                            "Loading keywords from cache...",
                                        )
                                        .ok();

                                    // Notify frontend that we're using cached keywords (offline mode)
                                    app_handle.emit("using-cached-keywords", ()).ok();

                                    tokio::time::sleep(tokio::time::Duration::from_millis(500))
                                        .await;
                                } else {
                                    log::info!("Cached JSON is not an array, will fetch from API");
                                }
                            }
                            Err(e) => log::warn!(
                                "Failed to parse cached JSON: {}, will fetch from API",
                                e
                            ),
                        }
                    }
                    Err(e) => {
                        log::warn!("Failed to read cached keywords: {}, will fetch from API", e)
                    }
                }
            } else {
                log::info!("No cached keywords found, will fetch from API");
            }
        }

        // Choose between cached data and API fetch
        if use_local_file {
            log::info!("Using cached keywords file");
            // Clear localStorage before adding cached data
            app_handle.emit("keyword-clear-localstorage", ()).ok();

            // Emit offline mode status notification
            app_handle.emit("using-cached-keywords", ()).ok();
            log::info!("Emitted using-cached-keywords event to indicate offline mode");

            // Use the cached data directly
            let json = local_json_data.unwrap();
            if let Some(arr) = json.as_array() {
                log::info!("Using cached JSON entries: {}", arr.len());
                // Store the array in localStorage via frontend event
                let json_string = serde_json::to_string_pretty(&arr).unwrap();
                app_handle
                    .emit("keyword-store-localstorage", json_string.clone())
                    .ok();
            }

            app_handle
                .emit("keyword-loading-progress", "Parsing keywords...")
                .ok();
            // Simulate parsing
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            app_handle.emit("keyword-loading-progress", "done").ok();
        } else {
            log::info!("Fetching keywords from API");
            // Fetch from API since we couldn't load from cache
            let client = reqwest::Client::new();

            app_handle
                .emit(
                    "keyword-loading-progress",
                    "Fetching keywords from server...",
                )
                .ok();

            // Clear localStorage before fetching new data
            app_handle.emit("keyword-clear-localstorage", ()).ok();

            // Define retry parameters
            const MAX_RETRIES: usize = 3;
            const BASE_DELAY_MS: u64 = 1000; // Start with 1 second delay

            let mut response = None;

            for attempt in 0..=MAX_RETRIES {
                log::debug!("API fetch attempt {}", attempt);
                if attempt > 0 {
                    let delay = BASE_DELAY_MS * 2u64.pow(attempt as u32 - 1); // Exponential backoff
                    app_handle
                        .emit(
                            "keyword-loading-progress",
                            format!("Retry attempt {} of {}...", attempt, MAX_RETRIES),
                        )
                        .ok();
                    tokio::time::sleep(tokio::time::Duration::from_millis(delay)).await;
                }

                match client.get(&api_url).send().await {
                    Ok(resp) => {
                        log::info!("API call succeeded: {}", api_url);
                        response = Some(resp);
                        break;
                    }
                    Err(e) => {
                        log::error!("API call failed: {} - {}", api_url, e);
                        if attempt == MAX_RETRIES {
                            app_handle
                                .emit(
                                    "keyword-loading-progress",
                                    "Failed to fetch keywords after all retries",
                                )
                                .ok();

                            // Try to use cached data if available
                            if let Ok(app_data_dir) = app_handle.path().app_local_data_dir() {
                                let json_path = app_data_dir.join("keywords.json");
                                log::info!(
                                    "Falling back to cached keywords at {}",
                                    json_path.display()
                                );

                                if json_path.exists() {
                                    match fs::read_to_string(&json_path) {
                                        Ok(json_string) => {
                                            match serde_json::from_str::<serde_json::Value>(
                                                &json_string,
                                            ) {
                                                Ok(json) => {
                                                    if let Some(arr) = json.as_array() {
                                                        log::info!(
                                                            "Found cached keywords with {} entries",
                                                            arr.len()
                                                        );

                                                        // Emit offline mode status notification
                                                        app_handle
                                                            .emit("using-cached-keywords", ())
                                                            .ok();
                                                        log::info!(
                                                            "Emitted using-cached-keywords event to indicate offline mode"
                                                        );

                                                        // Store the array in localStorage via frontend event
                                                        let json_string =
                                                            serde_json::to_string_pretty(&arr)
                                                                .unwrap();
                                                        app_handle
                                                            .emit(
                                                                "keyword-store-localstorage",
                                                                json_string,
                                                            )
                                                            .ok();

                                                        app_handle
                                                            .emit(
                                                                "keyword-loading-progress",
                                                                "done",
                                                            )
                                                            .ok();
                                                        return ();
                                                    }
                                                }
                                                Err(e) => log::error!(
                                                    "Failed to parse cached JSON after API failure: {}",
                                                    e
                                                ),
                                            }
                                        }
                                        Err(e) => log::error!(
                                            "Failed to read cached keywords after API failure: {}",
                                            e
                                        ),
                                    }
                                }
                            }

                            // If we get here, both API and cache failed
                            app_handle
                                .emit(
                                    "keyword-loading-progress",
                                    "Failed to load keywords from API and no cache available",
                                )
                                .ok();
                            return ();
                        }
                    }
                }
            }

            let response = response.unwrap(); // Safe to unwrap as we only get here if we have a response
            let stream = response;
            // To print number of entries, buffer the full body and parse JSON
            let body = match stream.bytes().await {
                Ok(bytes) => bytes,
                Err(e) => {
                    log::error!("Failed to read response body: {}", e);
                    return;
                }
            };
            match serde_json::from_slice::<serde_json::Value>(&body) {
                Ok(json) => {
                    if let Some(arr) = json.as_array() {
                        log::info!("JSON entries: {}", arr.len());
                        // Store the array in localStorage via frontend event
                        let json_string = serde_json::to_string_pretty(&arr).unwrap();
                        app_handle
                            .emit("keyword-store-localstorage", json_string.clone())
                            .ok();

                        // Save the response to keywords.json file
                        if let Ok(app_data_dir) = app_handle.path().app_local_data_dir() {
                            let json_path = app_data_dir.join("keywords.json");
                            log::info!("Saving keywords to {}", json_path.display());
                            if let Err(e) = fs::write(&json_path, json_string) {
                                log::error!("Failed to write keywords.json: {}", e);
                            } else {
                                log::info!(
                                    "Successfully saved keywords to {}",
                                    json_path.display()
                                );
                            }
                        } else {
                            log::error!(
                                "Could not determine app data directory to save keywords.json"
                            );
                        }
                    } else {
                        log::warn!("JSON is not an array");
                    }
                }
                Err(e) => log::error!("Failed to parse JSON: {}", e),
            }
            app_handle
                .emit("keyword-loading-progress", "Parsing keywords...")
                .ok();
            // Simulate parsing
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            app_handle.emit("keyword-loading-progress", "done").ok();
        } // Close the else block for API fetching

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
        log::debug!(
            "Keyword loading background task finished in {:?}",
            start.elapsed()
        );
    });
    Ok(())
}

#[tauri::command]
async fn get_version_info() -> Result<String, String> {
    log::info!("get_version_info called");

    // Create a reqwest client
    let client = reqwest::Client::new();

    // API URL for version information
    let api_url = "https://si0vmc0854.de.bosch.com/swap-prod/api/versions/bbm-keywords";

    // Make the API call
    match client.get(api_url).send().await {
        Ok(response) => {
            // Check if the request was successful
            if response.status().is_success() {
                // Parse the JSON response by first getting the bytes and then parsing
                let bytes = match response.bytes().await {
                    Ok(bytes) => bytes,
                    Err(e) => {
                        let error_msg = format!("Failed to read response body: {}", e);
                        log::error!("{}", error_msg);
                        return Err(error_msg);
                    }
                };

                match serde_json::from_slice::<serde_json::Value>(&bytes) {
                    Ok(json) => {
                        // Extract the updatedDate field
                        if let Some(updated_date) = json.get("updatedDate").and_then(|v| v.as_str())
                        {
                            log::info!("Version API returned updatedDate: {}", updated_date);

                            // Format the date (assuming format like "2025-06-13T06:52:11Z")
                            let formatted_date = if updated_date.len() >= 10 {
                                // Extract just the date part (YYYY-MM-DD)
                                let date_part = &updated_date[0..10];

                                // Try to parse and reformat the date
                                if date_part.len() == 10
                                    && date_part.chars().nth(4) == Some('-')
                                    && date_part.chars().nth(7) == Some('-')
                                {
                                    // Extract components
                                    let year = &date_part[0..4];
                                    let month = &date_part[5..7];
                                    let day = &date_part[8..10];

                                    // Format as DD.MM.YYYY
                                    format!("DB: {}.{}.{}", day, month, year)
                                } else {
                                    format!("DB: {}", updated_date) // Fallback if date format unexpected
                                }
                            } else {
                                format!("DB: {}", updated_date) // Fallback if string too short
                            };

                            Ok(formatted_date)
                        } else {
                            let error_msg = "updatedDate field not found in the response";
                            log::error!("{}", error_msg);
                            Err(error_msg.to_string())
                        }
                    }
                    Err(e) => {
                        let error_msg = format!("Failed to parse JSON response: {}", e);
                        log::error!("{}", error_msg);
                        Err(error_msg)
                    }
                }
            } else {
                let error_msg = format!("API request failed with status: {}", response.status());
                log::error!("{}", error_msg);
                Err(error_msg)
            }
        }
        Err(e) => {
            let error_msg = format!("Failed to make API request: {}", e);
            log::error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
fn get_tauri_config_urls(_app: AppHandle) -> Vec<String> {
    log::info!("get_tauri_config_urls called");
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
    log::debug!("Extracted URLs from tauri.conf.json: {:?}", urls);
    urls
}

#[tauri::command]
fn get_log_file_path(app: AppHandle) -> Result<String, String> {
    log::info!("get_log_file_path called");
    let result = match app.path().config_dir() {
        Ok(config_dir) => {
            let log_dir = config_dir.join("logs");
            let log_file = log_dir.join("BBMLabelExplorer.log");
            if log_file.exists() {
                Ok(log_file.to_string_lossy().into_owned())
            } else {
                Err(format!(
                    "Log file not found at expected location: {}",
                    log_file.display()
                ))
            }
        }
        Err(_) => Err("Unable to determine config directory".to_string()),
    };
    log::debug!("Log file path result: {:?}", result);
    result
}

#[tauri::command]
fn get_app_config_urls() -> Vec<String> {
    log::info!("get_app_config_urls called");
    // Hardcoded URLs instead of reading from a config file
    let urls = vec![
        "https://si0vmc0854.de.bosch.com/swap-prod/api/ubk-keywords".to_string(),
        "/index.html".to_string(),
        "/settings.html".to_string(),
    ];
    log::debug!("Returning app config URLs: {:?}", urls);
    urls
}

// Removed deprecated function since we're using hardcoded values now

fn main() {
    log::info!("Application starting up");
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            log::info!("Another application instance detected");
            log::debug!("New instance arguments: {:?}", args);
            match app.get_webview_window("main") {
                Some(window) => {
                    log::info!("Focusing existing main window");
                    if let Err(e) = window.set_focus() {
                        log::error!("Failed to set focus on main window: {}", e);
                    }
                }
                None => {
                    log::error!("Failed to find main window to focus");
                }
            }
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    // tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("BBMLabelExplorer".into()),
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .level(log::LevelFilter::Trace)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .max_file_size(1 /* MB */ * 1024 * 1024)
                .build(),
        )
        .manage(Arc::new(Mutex::new(SetupState {
            frontend_task: false,
            backend_task: false,
        })))
        .invoke_handler(tauri::generate_handler![
            set_complete,
            start_keyword_loading,
            get_system_memory,
            get_tauri_config_urls,
            get_app_config_urls,
            get_log_file_path,
            get_version_info
        ])
        .setup(|app| {
            log::info!("Setting up application UI components");

            // Create logs directory if it doesn't exist
            if let Ok(config_dir) = app.path().config_dir() {
                let log_dir = config_dir.join("logs");
                if !log_dir.exists() {
                    log::info!("Creating log directory at: {}", log_dir.display());
                    match fs::create_dir_all(&log_dir) {
                        Ok(_) => log::info!("Log directory created successfully"),
                        Err(e) => log::error!("Failed to create log directory: {}", e),
                    }
                }
            } else {
                log::warn!("Unable to determine config directory for log files");
            }

            let quit = MenuItemBuilder::new("Quit").id("quit").build(app).unwrap();
            let settings = MenuItemBuilder::new("Settings")
                .id("settings")
                .build(app)
                .unwrap();
            let menu = MenuBuilder::new(app)
                .items(&[&quit, &settings])
                .build()
                .unwrap();
            log::info!("Creating system tray icon and menu");
            let _ = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => {
                        log::info!("User requested application exit via tray menu");
                        app.exit(0)
                    }
                    "settings" => {
                        log::info!("Settings menu clicked from tray");
                        // Try to get the settings window
                        if let Some(window) = app.app_handle().get_webview_window("settings") {
                            log::info!("Showing existing settings window");
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        } else {
                            // Create settings window using tauri.conf.json configuration
                            log::info!("Creating new settings window from configuration");

                            // Create a window builder with the settings label
                            let builder = WebviewWindowBuilder::new(
                                app,
                                "settings",
                                tauri::WebviewUrl::App("/settings.html".into()),
                            )
                            // Apply the same settings as defined in tauri.conf.json
                            .title("Settings")
                            .maximizable(false)
                            .minimizable(false)
                            .inner_size(460.00, 460.00)
                            .min_inner_size(460.00, 460.00)
                            .focused(true)
                            .skip_taskbar(false)
                            .always_on_top(true)
                            .resizable(true)
                            .decorations(false)
                            .transparent(true);

                            // Build the window
                            match builder.build() {
                                Ok(window) => {
                                    log::info!("Settings window created successfully");
                                    // Ensure window gets focus
                                    let _ = window.set_focus();
                                }
                                Err(e) => {
                                    log::error!("Failed to create settings window: {}", e);
                                }
                            }
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray_icon, event| match event {
                    tauri::tray::TrayIconEvent::Click { button, .. } => {
                        if button == tauri::tray::MouseButton::Left {
                            log::info!("System tray received left click, showing main window");
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

            log::info!("Starting backend initialization process");
            let app_handle = app.handle().clone();
            let state = app.state::<Arc<Mutex<SetupState>>>();

            // Example: Fetch and log the version information
            log::info!("Fetching API version information...");
            let app_clone = app.handle().clone();

            // Create a date string for today's date in DD.MM.YYYY format
            let today = chrono::Local::now();
            let fallback_date = format!(
                "DB: {}.{}.{}",
                today.format("%d"),
                today.format("%m"),
                today.format("%Y")
            );

            tauri::async_runtime::spawn(async move {
                match get_version_info().await {
                    Ok(date) => {
                        log::info!("BBM Keywords updated date: {}", date);
                        // Emit an event to the frontend to display the date
                        app_clone.emit("version-info", date).ok();
                    }
                    Err(e) => {
                        log::error!("Failed to get version info: {}", e);
                        // If version API fails, emit the fallback date
                        log::info!("Using today's date as fallback: {}", fallback_date);
                        app_clone.emit("version-info", fallback_date).ok();
                    }
                }
            });

            // Start backend loading (await, since setup is sync)
            tauri::async_runtime::block_on(start_keyword_loading(app_handle, state)).ok();
            log::info!("Application setup completed");
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    log::info!("Main window close requested, hiding instead of closing");
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    log::debug!("Tauri main function setup complete");
    log::info!("Application terminated");
}

#[tauri::command]
fn get_system_memory() -> String {
    log::info!("System memory information requested");
    let mut sys = System::new_all();

    // First we update all information of our `System` struct.
    sys.refresh_all();

    log::debug!(
        "System memory: total={} KB, used={} KB",
        sys.total_memory(),
        sys.used_memory()
    );
    sys.used_memory().to_string()
}
