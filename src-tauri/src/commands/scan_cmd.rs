use std::path::PathBuf;

use crate::commands::project_cmd;
use crate::graph::types::GraphSnapshot;

/// Run the full scan pipeline on a project root:
/// 1. Walk filesystem → build nodes/edges (Tier 0)
/// 2. Run Tier 1 parsers on supported files
/// 3. Persist everything to SQLite
#[tauri::command]
pub async fn scan_project(project_root: String) -> Result<GraphSnapshot, String> {
    let project_name = PathBuf::from(&project_root)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unnamed Project".into());

    // Step 1: Walk and classify (Tier 0)
    let walk_result = crate::scanner::walker::walk_project(&project_root, &project_name)
        .map_err(|e| e.to_string())?;

    // Step 2: Run Tier 1 parsers on supported files
    let mut parsed_nodes = Vec::new();
    let mut parsed_edges = Vec::new();

    for node in &walk_result.nodes {
        if node.node_type == crate::graph::types::NodeType::File {
            if let Some(ref path_str) = node.file_path {
                let path = std::path::Path::new(path_str);
                let classification = node.classification.as_deref().unwrap_or("");

                match classification {
                    "godot_scene" => {
                        if let Ok(result) = crate::parser::tscn::parse_tscn(path, &node.id) {
                            parsed_nodes.extend(result.nodes);
                            parsed_edges.extend(result.edges);
                        }
                    }
                    "shader_glsl" | "shader_hlsl" | "shader_cg" => {
                        if let Ok(result) = crate::parser::shader::parse_shader_deps(path, &node.id) {
                            parsed_nodes.extend(result.nodes);
                            parsed_edges.extend(result.edges);
                        }
                    }
                    "source_code" | "godot_script" => {
                        if let Ok(result) = crate::parser::shader::parse_source_deps(path, &node.id) {
                            parsed_nodes.extend(result.nodes);
                            parsed_edges.extend(result.edges);
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    // Step 3: Persist to SQLite
    let conn = project_cmd::open_graph_db(&project_root).map_err(|e| e.to_string())?;

    // Clear existing data and repopulate
    crate::graph::ops::clear_graph(&conn).map_err(|e| e.to_string())?;
    crate::graph::ops::insert_nodes(&conn, &walk_result.nodes).map_err(|e| e.to_string())?;
    crate::graph::ops::insert_edges(&conn, &walk_result.edges).map_err(|e| e.to_string())?;
    crate::graph::ops::insert_nodes(&conn, &parsed_nodes).map_err(|e| e.to_string())?;
    crate::graph::ops::insert_edges(&conn, &parsed_edges).map_err(|e| e.to_string())?;

    // Return the full graph
    crate::graph::ops::get_full_graph(&conn).map_err(|e| e.to_string())
}
