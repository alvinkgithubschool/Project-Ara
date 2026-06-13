/// Tier 1 parser for Godot .tscn scene files.
///
/// Extracts the scene tree structure: node hierarchy and resource references.
/// .tscn files use a custom INI-like format.
use std::collections::HashMap;
use std::path::Path;

use crate::graph::types::{GraphEdge, GraphNode, NodeType};
use crate::utils::error::AppError;

/// A parsed scene entity extracted from a .tscn file.
#[derive(Debug, Clone)]
pub struct ParsedTscn {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

/// Parse a Godot .tscn file and extract structured nodes and edges.
pub fn parse_tscn(file_path: &Path, file_node_id: &str) -> Result<ParsedTscn, AppError> {
    let content = std::fs::read_to_string(file_path)
        .map_err(|e| AppError::Parse(format!("Cannot read {}: {e}", file_path.display())))?;

    let mut graph_nodes: Vec<GraphNode> = Vec::new();
    let mut graph_edges: Vec<GraphEdge> = Vec::new();
    let now = chrono::Utc::now().to_rfc3339();

    // Parse the [ext_resource] and [sub_resource] sections
    let mut resources: HashMap<String, String> = HashMap::new(); // id -> path
    let mut current_section = "";
    let mut node_parent: HashMap<String, String> = HashMap::new(); // node name -> parent name

    for line in content.lines() {
        let trimmed = line.trim();

        // Section headers
        if trimmed.starts_with("[ext_resource") {
            current_section = "ext_resource";
            continue;
        }
        if trimmed.starts_with("[sub_resource") {
            current_section = "sub_resource";
            continue;
        }
        if trimmed.starts_with("[node") {
            current_section = "node";
            continue;
        }
        if trimmed.starts_with("[") && trimmed.ends_with("]") {
            current_section = "";
            continue;
        }

        match current_section {
            "ext_resource" => {
                // path="res://path/to/file" type="..." id=1
                let id = extract_value(trimmed, "id=");
                let path = extract_quoted_value(trimmed, "path=");
                if let (Some(id), Some(path)) = (id, path) {
                    resources.insert(id, path);
                }
            }
            "sub_resource" => {
                let id = extract_value(trimmed, "id=");
                let res_type = extract_quoted_value(trimmed, "type=");
                if let (Some(id), Some(res_type)) = (id, res_type) {
                    let node_id = uuid::Uuid::new_v4().to_string();
                    graph_nodes.push(GraphNode {
                        id: node_id.clone(),
                        node_type: NodeType::ParsedEntity,
                        label: format!("{} ({})", res_type, id),
                        file_path: None,
                        classification: Some("godot_resource".into()),
                        metadata: serde_json::json!({
                            "resource_id": id,
                            "resource_type": res_type,
                            "source_file": file_path.to_string_lossy(),
                        }),
                        created_at: now.clone(),
                        updated_at: now.clone(),
                    });
                    // Edge from file node to parsed entity
                    graph_edges.push(GraphEdge {
                        id: uuid::Uuid::new_v4().to_string(),
                        edge_type: crate::graph::types::EdgeType::Contains,
                        source_id: file_node_id.to_string(),
                        target_id: node_id,
                        label: Some("defines_resource".into()),
                        metadata: serde_json::json!({}),
                    });
                }
            }
            "node" => {
                // Extract node name and parent
                if let Some(name_start) = trimmed.find("name=\"") {
                    let rest = &trimmed[name_start + 6..];
                    if let Some(name_end) = rest.find('"') {
                        let node_name = rest[..name_end].to_string();

                        // Check for parent
                        let parent = extract_quoted_value(trimmed, "parent=");
                        if let Some(parent_name) = parent.clone() {
                            node_parent.insert(node_name.clone(), parent_name);
                        }

                        let node_type_name =
                            extract_quoted_value(trimmed, "type=").unwrap_or_else(|| "Node".into());

                        let node_id = uuid::Uuid::new_v4().to_string();
                        graph_nodes.push(GraphNode {
                            id: node_id.clone(),
                            node_type: NodeType::ParsedEntity,
                            label: format!("{} ({})", node_name, node_type_name),
                            file_path: None,
                            classification: Some("godot_scene_node".into()),
                            metadata: serde_json::json!({
                                "node_name": node_name,
                                "node_type": node_type_name,
                                "parent": parent,
                                "source_file": file_path.to_string_lossy(),
                            }),
                            created_at: now.clone(),
                            updated_at: now.clone(),
                        });

                        // CONTAINS edge from file node
                        graph_edges.push(GraphEdge {
                            id: uuid::Uuid::new_v4().to_string(),
                            edge_type: crate::graph::types::EdgeType::Contains,
                            source_id: file_node_id.to_string(),
                            target_id: node_id.clone(),
                            label: Some("contains_node".into()),
                            metadata: serde_json::json!({}),
                        });
                    }
                }
            }
            _ => {}
        }
    }

    // Build parent-child edges between scene nodes
    let node_id_map: HashMap<String, String> = graph_nodes
        .iter()
        .filter(|n| n.classification.as_deref() == Some("godot_scene_node"))
        .filter_map(|n| {
            n.metadata
                .get("node_name")
                .and_then(|v| v.as_str())
                .map(|name| (name.to_string(), n.id.clone()))
        })
        .collect();

    for (child_name, parent_name) in &node_parent {
        if let (Some(child_id), Some(parent_id)) =
            (node_id_map.get(child_name), node_id_map.get(parent_name))
        {
            graph_edges.push(GraphEdge {
                id: uuid::Uuid::new_v4().to_string(),
                edge_type: crate::graph::types::EdgeType::Contains,
                source_id: parent_id.clone(),
                target_id: child_id.clone(),
                label: Some("parent_of".into()),
                metadata: serde_json::json!({}),
            });
        }
    }

    // Link external resource references (USES edges from scene to resources)
    for (res_id, res_path) in &resources {
        // Find the resource node
        for node in &graph_nodes {
            if let Some(meta_id) = node.metadata.get("resource_id").and_then(|v| v.as_str()) {
                if meta_id == res_id {
                    // Create USES edge from scene (file node) to resource
                    graph_edges.push(GraphEdge {
                        id: uuid::Uuid::new_v4().to_string(),
                        edge_type: crate::graph::types::EdgeType::Uses,
                        source_id: file_node_id.to_string(),
                        target_id: node.id.clone(),
                        label: Some(format!("uses_resource: {res_path}")),
                        metadata: serde_json::json!({
                            "resource_path": res_path,
                        }),
                    });
                }
            }
        }
    }

    Ok(ParsedTscn {
        nodes: graph_nodes,
        edges: graph_edges,
    })
}

/// Extract a value from a key=value pair in Godot resource format.
fn extract_value(line: &str, key: &str) -> Option<String> {
    let rest = line.strip_prefix(key)?;
    // Value may or may not be quoted
    let rest = rest.trim();
    if rest.starts_with('"') {
        extract_quoted(line, key)
    } else {
        rest.split_whitespace().next().map(|s| s.to_string())
    }
}

/// Extract a quoted value: key="value"
fn extract_quoted_value(line: &str, key: &str) -> Option<String> {
    extract_quoted(line, key)
}

fn extract_quoted(line: &str, key: &str) -> Option<String> {
    let rest = line.strip_prefix(key)?;
    let rest = rest.trim();
    if rest.starts_with('"') {
        let inner = &rest[1..];
        inner.find('"').map(|end| inner[..end].to_string())
    } else {
        None
    }
}
