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
