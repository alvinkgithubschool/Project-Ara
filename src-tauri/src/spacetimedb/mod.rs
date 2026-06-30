//! SpacetimeDB connection wiring (stub).
//!
//! Per `AGENTS.md`, SpacetimeDB is "wired, not synced": local SQLite remains the
//! source of truth for project graph state. This module models the connection
//! state so the UI can surface a status indicator, and so the real SDK can be
//! dropped in later. The actual server-side module lives in the separate
//! `spacetime-module/` crate (see Day 5).
//!
//! It deliberately does NOT depend on `spacetimedb-sdk`: pulling a heavyweight,
//! unvetted crate into the Tauri build is the highest-risk action in the sprint
//! and a broken `cargo build` blocks everything. The schema/reducer definitions
//! here are plain wire types that mirror the future module.

pub mod reducer;
pub mod schema;

use serde::{Deserialize, Serialize};

/// Snapshot of the SpacetimeDB connection, serialized to the frontend for the
/// settings status indicator.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpacetimeStatus {
    pub connected: bool,
    pub identity: Option<String>,
    pub uri: Option<String>,
    pub module: Option<String>,
}

/// Manages the (stubbed) SpacetimeDB connection for real-time graph state.
pub struct SpacetimeConnection {
    pub connected: bool,
    pub identity: Option<String>,
    pub uri: Option<String>,
    pub module: Option<String>,
}

impl SpacetimeConnection {
    pub fn new() -> Self {
        SpacetimeConnection {
            connected: false,
            identity: None,
            uri: None,
            module: None,
        }
    }

    /// Record connection configuration to a SpacetimeDB instance (local or
    /// remote). This does not open a live socket yet — it captures intent so
    /// the UI can reflect "wired" state.
    pub fn connect(&mut self, uri: &str, module_name: &str) -> Result<(), String> {
        log::info!("SpacetimeDB connection configured: {uri} / {module_name}");
        self.uri = Some(uri.to_string());
        self.module = Some(module_name.to_string());
        Ok(())
    }

    pub fn status(&self) -> SpacetimeStatus {
        SpacetimeStatus {
            connected: self.connected,
            identity: self.identity.clone(),
            uri: self.uri.clone(),
            module: self.module.clone(),
        }
    }
}

impl Default for SpacetimeConnection {
    fn default() -> Self {
        Self::new()
    }
}

/// Report the SpacetimeDB wiring status to the frontend.
///
/// Honestly reflects "wired, not synced": the local module URI/name are
/// reported, but `connected` is `false` because no live sync session is open.
#[tauri::command]
pub async fn get_spacetimedb_status() -> Result<SpacetimeStatus, String> {
    let mut conn = SpacetimeConnection::new();
    conn.connect("http://localhost:3000", "project-ara")?;
    Ok(conn.status())
}
