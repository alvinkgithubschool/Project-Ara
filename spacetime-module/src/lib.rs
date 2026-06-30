//! Project Ara SpacetimeDB module.
//!
//! This is a SEPARATE crate from the Tauri app. It is compiled to WASM and
//! deployed with the `spacetime` CLI:
//!
//! ```bash
//! cd spacetime-module
//! spacetime publish -s local project-ara
//! ```
//!
//! It is deliberately not part of the app's cargo workspace, so the app build
//! never depends on the SpacetimeDB toolchain. The Tauri side only models
//! connection state (see `src-tauri/src/spacetimedb/`); SQLite remains the
//! source of truth for graph state until real sync is enabled.
//!
//! NOTE: the macro API tracks the SpacetimeDB release. This targets the 1.x
//! Rust module API; confirm against your installed `spacetime version`.

use spacetimedb::{reducer, table, ReducerContext, Table};

#[table(name = ara_node, public)]
pub struct AraNode {
    #[primary_key]
    pub id: String,
    pub project_id: String,
    pub node_type: String,
    pub label: String,
    pub data_json: String,
}

#[reducer]
pub fn insert_nodes(ctx: &ReducerContext, nodes: Vec<AraNode>) {
    for node in nodes {
        ctx.db.ara_node().insert(node);
    }
}
