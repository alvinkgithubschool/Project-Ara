use crate::commands::project_cmd;
use crate::graph::types::{GraphEdge, GraphNode, GraphSnapshot};

/// Get the full graph for a project.
#[tauri::command]
pub async fn get_graph(project_root: String) -> Result<GraphSnapshot, String> {
    let conn = project_cmd::open_graph_db(&project_root).map_err(|e| e.to_string())?;
    crate::graph::ops::get_full_graph(&conn).map_err(|e| e.to_string())
}

/// Get a single node by ID.
#[tauri::command]
pub async fn get_graph_node(project_root: String, node_id: String) -> Result<Option<GraphNode>, String> {
    let conn = project_cmd::open_graph_db(&project_root).map_err(|e| e.to_string())?;
    crate::graph::ops::get_node(&conn, &node_id).map_err(|e| e.to_string())
}

/// Get edges for a specific node.
#[tauri::command]
pub async fn get_graph_node_edges(
    project_root: String,
    node_id: String,
) -> Result<Vec<GraphEdge>, String> {
    let conn = project_cmd::open_graph_db(&project_root).map_err(|e| e.to_string())?;
    crate::graph::ops::get_node_edges(&conn, &node_id).map_err(|e| e.to_string())
}
