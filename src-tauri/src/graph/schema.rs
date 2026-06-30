use rusqlite::Connection;

/// Create the graph tables in the provided SQLite connection.
pub fn initialize_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS nodes (
            id          TEXT PRIMARY KEY NOT NULL,
            node_type   TEXT NOT NULL,
            label       TEXT NOT NULL,
            file_path   TEXT,
            classification TEXT,
            metadata    TEXT NOT NULL DEFAULT '{}',
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS edges (
            id          TEXT PRIMARY KEY NOT NULL,
            edge_type   TEXT NOT NULL,
            source_id   TEXT NOT NULL,
            target_id   TEXT NOT NULL,
            label       TEXT,
            metadata    TEXT NOT NULL DEFAULT '{}',
            FOREIGN KEY (source_id) REFERENCES nodes(id) ON DELETE CASCADE,
            FOREIGN KEY (target_id) REFERENCES nodes(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
        CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
        CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);
        CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes(file_path);
        ",
    )?;

    Ok(())
}

/// Initialize the global projects database at `<app_data_dir>/projects.db`.
///
/// This is distinct from the per-project `.ara/graph.db` (scan graph). It holds
/// app-level state that spans projects: the project registry, linked folders,
/// canvas state (notes/media/operators) and per-project agent configuration.
pub fn initialize_projects_db(
    app_data_dir: &std::path::Path,
) -> Result<Connection, rusqlite::Error> {
    let db_path = app_data_dir.join("projects.db");
    let conn = Connection::open(&db_path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS linked_folders (
            id TEXT PRIMARY KEY NOT NULL,
            project_id TEXT NOT NULL,
            path TEXT NOT NULL,
            label TEXT NOT NULL,
            ecosystem TEXT,
            tier TEXT NOT NULL DEFAULT 'auto',
            color_tag TEXT NOT NULL DEFAULT '#00d4ff',
            added_at TEXT NOT NULL,
            last_scanned_at TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS canvas_state (
            id TEXT PRIMARY KEY NOT NULL,
            project_id TEXT NOT NULL,
            parent_canvas_id TEXT,
            label TEXT NOT NULL,
            viewport_x REAL NOT NULL DEFAULT 0,
            viewport_y REAL NOT NULL DEFAULT 0,
            viewport_zoom REAL NOT NULL DEFAULT 1.0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS canvas_objects (
            id TEXT PRIMARY KEY NOT NULL,
            canvas_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            object_type TEXT NOT NULL,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            width REAL,
            height REAL,
            z_index INTEGER NOT NULL DEFAULT 0,
            data TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (canvas_id) REFERENCES canvas_state(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS agent_configs (
            id TEXT PRIMARY KEY NOT NULL,
            project_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            endpoint_url TEXT,
            model_name TEXT,
            api_key_ref TEXT,
            permissions TEXT NOT NULL DEFAULT '{}',
            enabled INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_linked_folders_project ON linked_folders(project_id);
        CREATE INDEX IF NOT EXISTS idx_canvas_state_project ON canvas_state(project_id);
        CREATE INDEX IF NOT EXISTS idx_canvas_objects_canvas ON canvas_objects(canvas_id);
        ",
    )?;

    Ok(conn)
}
