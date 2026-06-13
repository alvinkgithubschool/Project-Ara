use std::path::PathBuf;

use crate::utils::error::AppError;

/// Bootstrap the `.ara/` directory inside a project root.
#[tauri::command]
pub async fn bootstrap_project(project_root: String) -> Result<String, String> {
    let ara_dir = PathBuf::from(&project_root).join(".ara");
    let cache_dir = ara_dir.join("cache");

    std::fs::create_dir_all(&ara_dir)
        .map_err(|e| format!("Failed to create .ara/: {e}"))?;
    std::fs::create_dir_all(&cache_dir)
        .map_err(|e| format!("Failed to create .ara/cache/: {e}"))?;

    // Create config.toml if it doesn't exist
    let config_path = ara_dir.join("config.toml");
    if !config_path.exists() {
        let default_config = r#"# Project Ara configuration
# SpacetimeDB (deferred for future MVP)
# spacetime_url = ""

[scan]
# Directories to exclude from scanning
exclude = [".git", "node_modules", ".ara", "__pycache__", "target"]
"#;
        std::fs::write(&config_path, default_config)
            .map_err(|e| format!("Failed to write config.toml: {e}"))?;
    }

    // Initialize graph.db with schema
    let db_path = ara_dir.join("graph.db");
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Failed to open graph.db: {e}"))?;

    crate::graph::schema::initialize_schema(&conn)
        .map_err(|e| format!("Failed to initialize schema: {e}"))?;

    Ok(ara_dir.to_string_lossy().to_string())
}

/// Open the graph database for a project.
pub fn open_graph_db(project_root: &str) -> Result<rusqlite::Connection, AppError> {
    let db_path = PathBuf::from(project_root).join(".ara").join("graph.db");
    let conn = rusqlite::Connection::open(&db_path)?;
    Ok(conn)
}
