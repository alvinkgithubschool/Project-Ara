mod auth;
mod commands;
mod graph;
mod parser;
mod scanner;
mod utils;

use commands::auth_cmd::SessionState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(SessionState {
            session: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth_cmd::sign_in,
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
