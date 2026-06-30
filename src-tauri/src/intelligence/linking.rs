//! Connection inference.
//!
//! Proposes edges between nodes that look related, based on shared file stems
//! across folders/ecosystems (the core cross-tool correlation use case). These
//! are *suggestions* surfaced in the Connection Report — the user accepts or
//! dismisses them; nothing is persisted automatically.

use crate::graph::types::{GraphNode, NodeType};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvidenceItem {
    pub evidence_type: String,
    pub detail: String,
}

/// Mirrors the frontend `ConnectionSuggestion` shape (see ConnectionReport.tsx).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionSuggestion {
    pub id: String,
    pub suggestion_type: String,
    pub source_node_id: Option<String>,
    pub target_node_id: Option<String>,
    pub proposed_edge_type: Option<String>,
    pub confidence: f64,
    pub reason: String,
    pub evidence: Vec<EvidenceItem>,
    pub status: String,
}

pub struct LinkEngine;

impl LinkEngine {
    pub fn new() -> Self {
        LinkEngine
    }

    /// Infer connection suggestions across the scanned file nodes.
    pub fn run(&self, nodes: &[GraphNode]) -> Vec<ConnectionSuggestion> {
        let mut suggestions = Vec::new();

        // Group File nodes by lowercased stem.
        let mut stem_groups: HashMap<String, Vec<&GraphNode>> = HashMap::new();
        for node in nodes {
            if node.node_type != NodeType::File {
                continue;
            }
            if let Some(ref p) = node.file_path {
                if let Some(stem) = Path::new(p).file_stem().and_then(|s| s.to_str()) {
                    stem_groups
                        .entry(stem.to_lowercase())
                        .or_default()
                        .push(node);
                }
            }
        }

        for (stem, group) in stem_groups {
            if group.len() < 2 {
                continue;
            }
            // Star-link the first node to the rest, but only propose a
            // connection when the two files live in *different* folders — same
            // folder + same stem is already covered by clustering.
            let anchor = group[0];
            let anchor_dir = parent_dir(anchor);

            for other in group.iter().skip(1) {
                let other_dir = parent_dir(other);
                let cross_folder = anchor_dir != other_dir;
                let confidence = if cross_folder { 0.65 } else { 0.5 };

                let mut evidence = vec![EvidenceItem {
                    evidence_type: "shared_name".into(),
                    detail: format!("Both files share the base name '{stem}'"),
                }];
                if cross_folder {
                    evidence.push(EvidenceItem {
                        evidence_type: "cross_folder".into(),
                        detail: "Files live in different folders".into(),
                    });
                }

                suggestions.push(ConnectionSuggestion {
                    id: uuid::Uuid::new_v4().to_string(),
                    suggestion_type: "shared_name".into(),
                    source_node_id: Some(anchor.id.clone()),
                    target_node_id: Some(other.id.clone()),
                    proposed_edge_type: Some("uses".into()),
                    confidence,
                    reason: format!(
                        "'{}' and '{}' may be related (shared base name '{stem}')",
                        anchor.label, other.label
                    ),
                    evidence,
                    status: "pending".into(),
                });
            }
        }

        suggestions.sort_by(|a, b| {
            b.confidence
                .partial_cmp(&a.confidence)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        suggestions
    }
}

impl Default for LinkEngine {
    fn default() -> Self {
        Self::new()
    }
}

fn parent_dir(node: &GraphNode) -> Option<String> {
    node.file_path
        .as_deref()
        .and_then(|p| Path::new(p).parent())
        .and_then(|d| d.to_str())
        .map(|s| s.to_string())
}
