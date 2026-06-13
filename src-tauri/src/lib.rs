mod commands;
mod graph;
mod parser;
mod scanner;
mod utils;

use std::sync::Mutex;

/// Path to the app data directory, set at startup.
pub struct AppDataState {
    pub app_data_dir: Mutex<std::path::PathBuf>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppDataState {
            app_data_dir: Mutex::new(std::env::current_dir().unwrap_or_default()),
        })
        .setup(|app| {
            // Resolve the actual app data directory
            use tauri::Manager;
            if let Ok(dir) = app.path().app_data_dir() {
                if let Some(state) = app.try_state::<AppDataState>() {
                    if let Ok(mut d) = state.app_data_dir.lock() {
                        *d = dir;
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::project_cmd::bootstrap_project,
            commands::scan_cmd::scan_project,
            commands::graph_cmd::get_graph,
            commands::graph_cmd::get_graph_node,
            commands::graph_cmd::get_graph_node_edges,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Project Ara");
}
