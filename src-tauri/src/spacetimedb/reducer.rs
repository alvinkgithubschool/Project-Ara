//! Reducer name constants — these map to SpacetimeDB server-side reducer
//! functions defined in the `spacetime-module/` crate.

// Referenced by the deferred sync path, not the app build yet.
#![allow(dead_code)]

pub mod reducers {
    pub const INSERT_NODES: &str = "insert_nodes";
    pub const INSERT_EDGES: &str = "insert_edges";
    pub const UPSERT_CANVAS_OBJECT: &str = "upsert_canvas_object";
    pub const ACCEPT_SUGGESTION: &str = "accept_suggestion";
}
