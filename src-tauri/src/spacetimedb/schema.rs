//! SpacetimeDB-compatible table definitions.
//!
//! These mirror the SQLite schema but represent the shape that the future
//! SpacetimeDB module (`spacetime-module/`) will expose. They are plain serde
//! structs here — when the real `spacetimedb-sdk` is adopted, derive
//! `SpacetimeType` on these (or the equivalents in the module crate).

// Wire types for the deferred sync path; not referenced by the app build yet.
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StdbNode {
    pub id: String,
    pub node_type: String,
    pub label: String,
    pub file_path: Option<String>,
    pub classification: Option<String>,
    pub metadata: String, // JSON string
    pub project_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StdbEdge {
    pub id: String,
    pub edge_type: String,
    pub source_id: String,
    pub target_id: String,
    pub label: Option<String>,
    pub metadata: String,
    pub confidence: f64,
    pub project_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StdbCanvasObject {
    pub id: String,
    pub canvas_id: String,
    pub project_id: String,
    pub object_type: String,
    pub position_x: f32,
    pub position_y: f32,
    pub data: String, // JSON
}
