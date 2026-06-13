mod auth;
mod commands;
mod graph;
mod parser;
mod scanner;
mod utils;

use commands::auth_cmd::{AppDataState, SessionState};
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(SessionState {
            session: Mutex::new(None),
        })
        .manage(AppDataState {
            app_data_dir: Mutex::new(std::env::current_dir().unwrap_or_default()),
        })
        .setup(|app| {
            // Resolve the actual app data directory
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
            commands::auth_cmd::sign_in,
            commands::auth_cmd::sign_up_local,
            commands::auth_cmd::sign_in_local,
            commands::auth_cmd::setup_totp,
            commands::auth_cmd::enable_totp,
            commands::auth_cmd::webauthn_register_challenge,
            commands::auth_cmd::webauthn_register_verify,
            commands::auth_cmd::webauthn_auth_challenge,
            commands::auth_cmd::webauthn_auth_verify,
            commands::auth_cmd::mock_login,
            commands::auth_cmd::restore_session,
            commands::auth_cmd::sign_out,
            commands::auth_cmd::get_session,
            commands::project_cmd::bootstrap_project,
            commands::scan_cmd::scan_project,
            commands::graph_cmd::get_graph,
            commands::graph_cmd::get_graph_node,
            commands::graph_cmd::get_graph_node_edges,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Project Ara");
}
