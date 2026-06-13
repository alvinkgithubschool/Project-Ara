/// App-level authentication database.
///
/// Separate from per-project graph databases. Stores user accounts,
/// TOTP secrets, and passkey credentials in the Tauri app data directory.
use rusqlite::Connection;
use std::path::PathBuf;

use crate::utils::error::AppError;

/// Open or create the app-level auth database.
pub fn open_auth_db(app_data_dir: &PathBuf) -> Result<Connection, AppError> {
    std::fs::create_dir_all(app_data_dir)
        .map_err(|e| AppError::Auth(format!("Cannot create app data dir: {e}")))?;

    let db_path = app_data_dir.join("ara_auth.db");
    let conn = Connection::open(&db_path)
        .map_err(|e| AppError::Auth(format!("Cannot open auth DB: {e}")))?;

    initialize_schema(&conn)?;
    Ok(conn)
}

fn initialize_schema(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS local_users (
            id          TEXT PRIMARY KEY NOT NULL,
            username    TEXT NOT NULL UNIQUE,
            email       TEXT,
            password_hash TEXT NOT NULL,
            created_at  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS totp_secrets (
            user_id     TEXT PRIMARY KEY NOT NULL,
            secret      TEXT NOT NULL,
            enabled     INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES local_users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS passkey_credentials (
            id          TEXT PRIMARY KEY NOT NULL,
            user_id     TEXT NOT NULL,
            credential_id TEXT NOT NULL UNIQUE,
            public_key  TEXT NOT NULL,
            created_at  TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES local_users(id) ON DELETE CASCADE
        );
        ",
    )
    .map_err(|e| AppError::Auth(format!("Schema init failed: {e}")))?;

    Ok(())
}
