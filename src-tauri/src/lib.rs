mod auth_server;
mod commands;
mod graph;
mod intelligence;
mod parser;
mod scanner;
mod spacetimedb;
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
                std::fs::create_dir_all(&dir).ok();
                if let Some(state) = app.try_state::<AppDataState>() {
                    if let Ok(mut d) = state.app_data_dir.lock() {
                        *d = dir.clone();
                    }
                }

                // Initialize the global projects database (canvas state, linked
                // folders, agent configs). Distinct from per-project graph.db.
                if let Err(e) = crate::graph::schema::initialize_projects_db(&dir) {
                    log::error!("Failed to initialize projects.db: {e}");
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
            commands::canvas_cmd::upsert_canvas_object,
            commands::canvas_cmd::upsert_canvas_state,
            commands::canvas_cmd::load_canvas_state,
            commands::canvas_cmd::delete_canvas_object,
            commands::canvas_cmd::save_viewport,
            spacetimedb::get_spacetimedb_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Project Ara");
}
