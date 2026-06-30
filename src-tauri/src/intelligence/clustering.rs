use crate::graph::types::{GraphNode, NodeType};
use crate::intelligence::adapters;
use crate::intelligence::{AdapterRegistry, ClusteringHint};
use std::path::Path;

pub struct ClusteringEngine {
    registry: AdapterRegistry,
}

impl ClusteringEngine {
    pub fn new() -> Self {
        let mut registry = AdapterRegistry::new();
        adapters::register_all(&mut registry);
        ClusteringEngine { registry }
    }

    /// Run every registered adapter over the file nodes belonging to its
    /// ecosystem and collect the resulting clustering hints, best-confidence
    /// first.
    pub fn run(&self, nodes: &[GraphNode]) -> Vec<ClusteringHint> {
        let mut hints = Vec::new();

        for adapter in self.registry.get_all() {
            let info = adapter.ecosystem_info();

            // Select File nodes whose on-disk extension belongs to this
            // ecosystem. (The plan filtered on classification substrings, which
            // misfires because classifications are names like "godot_scene",
            // not extensions like "tscn" — we match the real file extension.)
            let ecosystem_nodes: Vec<GraphNode> = nodes
                .iter()
                .filter(|n| n.node_type == NodeType::File)
                .filter(|n| {
                    n.file_path
                        .as_deref()
                        .and_then(|p| Path::new(p).extension())
                        .and_then(|e| e.to_str())
                        .map(|ext| {
                            info.extensions
                                .iter()
                                .any(|known| known.eq_ignore_ascii_case(ext))
                        })
                        .unwrap_or(false)
                })
                .cloned()
                .collect();

            if !ecosystem_nodes.is_empty() {
                hints.extend(adapter.suggest_clusters(&ecosystem_nodes));
            }
        }

        hints.sort_by(|a, b| {
            b.confidence
                .partial_cmp(&a.confidence)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        hints
    }
}

impl Default for ClusteringEngine {
    fn default() -> Self {
        Self::new()
    }
}
