/// Shader dependency detection for text-based shader files.
///
/// Detects `#include` directives and similar patterns in GLSL, HLSL, and Cg shaders.
use std::path::Path;

use crate::graph::types::{GraphEdge, GraphNode, NodeType};
use crate::utils::error::AppError;

/// Result of shader dependency parsing.
#[derive(Debug, Clone)]
pub struct ParsedShader {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

/// Parse a shader file to detect includes and dependencies.
pub fn parse_shader_deps(
    file_path: &Path,
    file_node_id: &str,
) -> Result<ParsedShader, AppError> {
    let content = std::fs::read_to_string(file_path).map_err(|_| {
        AppError::Parse(format!("Cannot read shader: {}", file_path.display()))
    })?;

    let mut graph_nodes: Vec<GraphNode> = Vec::new();
    let mut graph_edges: Vec<GraphEdge> = Vec::new();
    let now = chrono::Utc::now().to_rfc3339();

    for (line_no, line) in content.lines().enumerate() {
        let trimmed = line.trim();

        // GLSL-style: #include "file" or #include <file>
        if trimmed.starts_with("#include") {
            let rest = trimmed[8..].trim();
            let included = if rest.starts_with('"') && rest[1..].contains('"') {
                rest[1..].split('"').next().map(|s| s.to_string())
            } else if rest.starts_with('<') && rest.contains('>') {
                rest[1..].split('>').next().map(|s| s.to_string())
            } else {
                None
            };

            if let Some(included_path) = included {
                let dep_id = uuid::Uuid::new_v4().to_string();
                graph_nodes.push(GraphNode {
                    id: dep_id.clone(),
                    node_type: NodeType::ParsedEntity,
                    label: format!("include: {}", included_path),
                    file_path: None,
                    classification: Some("shader_include".into()),
                    metadata: serde_json::json!({
                        "included_path": included_path,
                        "line": line_no + 1,
                        "source_file": file_path.to_string_lossy(),
                    }),
                    created_at: now.clone(),
                    updated_at: now.clone(),
                });

                graph_edges.push(GraphEdge {
                    id: uuid::Uuid::new_v4().to_string(),
                    edge_type: crate::graph::types::EdgeType::Uses,
                    source_id: file_node_id.to_string(),
                    target_id: dep_id,
                    label: Some(format!("includes: {}", included_path)),
                    metadata: serde_json::json!({
                        "line": line_no + 1,
                    }),
                });
            }
        }

        // HLSL-style: #include "file.fxh"
        // (Same pattern, already covered above)

        // CG-style: #include "file.cginc"
        // (Same pattern, already covered above)
    }

    Ok(ParsedShader {
        nodes: graph_nodes,
        edges: graph_edges,
    })
}

/// Parse a general source code file to detect import/dependency statements.
/// Supports C# (using), Python (import/from), JavaScript/TypeScript (import/require),
/// Rust (use/extern crate), GDScript (extends/class_name).
pub fn parse_source_deps(
    file_path: &Path,
    file_node_id: &str,
) -> Result<ParsedShader, AppError> {
    let content = std::fs::read_to_string(file_path).map_err(|_| {
        AppError::Parse(format!("Cannot read source: {}", file_path.display()))
    })?;

    let ext = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let mut graph_nodes: Vec<GraphNode> = Vec::new();
    let mut graph_edges: Vec<GraphEdge> = Vec::new();
    let now = chrono::Utc::now().to_rfc3339();

    for (line_no, line) in content.lines().enumerate() {
        let trimmed = line.trim();

        let dependency = match ext {
            "gd" => {
                // GDScript: extends "res://..." or class_name
                if trimmed.starts_with("extends ") {
                    Some(trimmed[8..].trim().trim_matches('"').to_string())
                } else {
                    None
                }
            }
            "cs" => {
                // C#: using Namespace;
                if trimmed.starts_with("using ") && trimmed.ends_with(';') {
                    Some(trimmed[6..trimmed.len() - 1].trim().to_string())
                } else {
                    None
                }
            }
            "py" => {
                // Python: import X or from X import Y
                if trimmed.starts_with("import ") {
                    Some(trimmed[7..].trim().to_string())
                } else if trimmed.starts_with("from ") {
                    trimmed[5..]
                        .split_whitespace()
                        .next()
                        .map(|s| s.to_string())
                } else {
                    None
                }
            }
            "js" | "ts" | "jsx" | "tsx" => {
                // JS/TS: import { X } from "Y" or require("Y")
                if trimmed.starts_with("import ") {
                    extract_js_import(trimmed)
                } else if trimmed.contains("require(") {
                    extract_require(trimmed)
                } else {
                    None
                }
            }
            "rs" => {
                // Rust: use crate::module or extern crate X
                if trimmed.starts_with("use ") {
                    Some(trimmed[4..].trim().trim_end_matches(';').to_string())
                } else if trimmed.starts_with("extern crate ") {
                    Some(trimmed[13..].trim().trim_end_matches(';').to_string())
                } else {
                    None
                }
            }
            _ => None,
        };

        if let Some(dep_name) = dependency {
            if !dep_name.is_empty() {
                let dep_id = uuid::Uuid::new_v4().to_string();
                graph_nodes.push(GraphNode {
                    id: dep_id.clone(),
                    node_type: NodeType::ParsedEntity,
                    label: format!("dep: {}", dep_name),
                    file_path: None,
                    classification: Some("code_dependency".into()),
                    metadata: serde_json::json!({
                        "dependency": dep_name,
                        "line": line_no + 1,
                        "source_file": file_path.to_string_lossy(),
                        "language": ext,
                    }),
                    created_at: now.clone(),
                    updated_at: now.clone(),
                });

                graph_edges.push(GraphEdge {
                    id: uuid::Uuid::new_v4().to_string(),
                    edge_type: crate::graph::types::EdgeType::Uses,
                    source_id: file_node_id.to_string(),
                    target_id: dep_id,
                    label: Some(format!("uses: {}", dep_name)),
                    metadata: serde_json::json!({
                        "line": line_no + 1,
                        "language": ext,
                    }),
                });
            }
        }
    }

    Ok(ParsedShader {
        nodes: graph_nodes,
        edges: graph_edges,
    })
}

fn extract_js_import(line: &str) -> Option<String> {
    // import { X } from "module"  or  import "module"
    if let Some(from_pos) = line.find("from ") {
        let rest = &line[from_pos + 5..].trim();
        rest.trim_matches('"')
            .trim_matches('\'')
            .trim_end_matches(';')
            .to_string();
        if !rest.is_empty() {
            return Some(rest.to_string());
        }
    } else if let Some(quote_pos) = line.find('"') {
        let rest = &line[quote_pos..].trim_matches('"').trim_end_matches(';');
        if !rest.is_empty() {
            return Some(rest.to_string());
        }
    }
    None
}

fn extract_require(line: &str) -> Option<String> {
    if let Some(start) = line.find("require(") {
        let inner = &line[start + 8..];
        if let Some(end) = inner.find(')') {
            return Some(inner[..end].trim_matches('"').trim_matches('\'').to_string());
        }
    }
    None
}
