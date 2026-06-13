use std::collections::HashMap;
use walkdir::WalkDir;

use crate::graph::types::{GraphEdge, GraphNode, NodeType};
use crate::utils::error::AppError;

/// Result of a single filesystem walk entry.
#[derive(Debug, Clone)]
pub struct WalkResult {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

/// Walk a project root directory and build the initial graph (nodes + CONTAINS edges).
///
/// Returns all nodes and edges discovered during the walk.
pub fn walk_project(project_root: &str, project_name: &str) -> Result<WalkResult, AppError> {
    let mut nodes: Vec<GraphNode> = Vec::new();
    let mut edges: Vec<GraphEdge> = Vec::new();
    let now = chrono::Utc::now().to_rfc3339();

    // Create project node
    let project_id = uuid::Uuid::new_v4().to_string();
    nodes.push(GraphNode {
        id: project_id.clone(),
        node_type: NodeType::Project,
        label: project_name.to_string(),
        file_path: Some(project_root.to_string()),
        classification: None,
        metadata: serde_json::json!({}),
        created_at: now.clone(),
        updated_at: now.clone(),
    });

    // Map from file path -> node ID for edge creation
    let mut path_to_id: HashMap<String, String> = HashMap::new();
    path_to_id.insert(project_root.to_string(), project_id.clone());

    // Walk filesystem
    for entry in WalkDir::new(project_root)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        let path_str = path.to_string_lossy().to_string();

        // Skip .ara directory
        if path_str.contains("/.ara/") || path_str.ends_with("/.ara") {
            continue;
        }

        // Skip hidden files/folders (except the root itself)
        if let Some(file_name) = path.file_name() {
            if file_name.to_string_lossy().starts_with('.') && path_str != project_root {
                continue;
            }
        }

        let node_id = uuid::Uuid::new_v4().to_string();

        if path.is_dir() {
            // Create folder node
            nodes.push(GraphNode {
                id: node_id.clone(),
                node_type: NodeType::Folder,
                label: path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| path_str.clone()),
                file_path: Some(path_str.clone()),
                classification: None,
                metadata: serde_json::json!({}),
                created_at: now.clone(),
                updated_at: now.clone(),
            });

            path_to_id.insert(path_str.clone(), node_id.clone());

            // CONTAINS edge from parent
            if let Some(parent) = path.parent() {
                let parent_str = parent.to_string_lossy().to_string();
                if let Some(parent_id) = path_to_id.get(&parent_str) {
                    edges.push(GraphEdge {
                        id: uuid::Uuid::new_v4().to_string(),
                        edge_type: crate::graph::types::EdgeType::Contains,
                        source_id: parent_id.clone(),
                        target_id: node_id.clone(),
                        label: None,
                        metadata: serde_json::json!({}),
                    });
                }
            }
        } else {
            // Classify the file
            let classification = crate::scanner::classifier::classify_file(path);

            // Create file node
            nodes.push(GraphNode {
                id: node_id.clone(),
                node_type: NodeType::File,
                label: path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| path_str.clone()),
                file_path: Some(path_str.clone()),
                classification: Some(classification.as_str().to_string()),
                metadata: serde_json::json!({
                    "size": entry.metadata().map(|m| m.len()).unwrap_or(0),
                    "extension": path.extension().map(|e| e.to_string_lossy().to_string()),
                }),
                created_at: now.clone(),
                updated_at: now.clone(),
            });

            path_to_id.insert(path_str.clone(), node_id.clone());

            // CONTAINS edge from parent
            if let Some(parent) = path.parent() {
                let parent_str = parent.to_string_lossy().to_string();
                if let Some(parent_id) = path_to_id.get(&parent_str) {
                    edges.push(GraphEdge {
                        id: uuid::Uuid::new_v4().to_string(),
                        edge_type: crate::graph::types::EdgeType::Contains,
                        source_id: parent_id.clone(),
                        target_id: node_id.clone(),
                        label: None,
                        metadata: serde_json::json!({}),
                    });
                }
            }
        }
    }

    Ok(WalkResult { nodes, edges })
}
