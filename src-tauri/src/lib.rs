mod auth_server;
mod commands;
mod graph;
mod parser;
mod scanner;
mod utils;

use std::sync::Mutex;

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
        .manage(auth_server::AuthServerProcess::new())
        .setup(|app| {
            use tauri::Manager;

            // Resolve the actual app data directory
            if let Ok(dir) = app.path().app_data_dir() {
                if let Some(state) = app.try_state::<AppDataState>() {
                    if let Ok(mut d) = state.app_data_dir.lock() {
                        *d = dir;
                    }
                }
            }

            // Auto-start the Better Auth server
            if let Some(state) = app.try_state::<auth_server::AuthServerProcess>() {
                match auth_server::start_auth_server(&state) {
                    Ok(port) => log::info!("Auth server started on port {port}"),
                    Err(e) => log::warn!("Auth server not started: {e}"),
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
