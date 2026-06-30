use crate::graph::types::{GraphNode, NodeType};
use crate::intelligence::{ClusteringHint, EcosystemAdapter, EcosystemInfo, EcosystemTier};
use std::collections::HashMap;
use std::path::Path;

pub struct GodotAdapter;

impl EcosystemAdapter for GodotAdapter {
    fn ecosystem_info(&self) -> EcosystemInfo {
        EcosystemInfo {
            id: "godot".into(),
            name: "Godot Engine".into(),
            tier: EcosystemTier::Full,
            description:
                "Full support: scene parsing, script dependency graphs, resource linking, cluster detection"
                    .into(),
            project_markers: vec!["project.godot".into()],
            extensions: vec![
                "tscn".into(),
                "tres".into(),
                "gd".into(),
                "godot".into(),
                "gdshader".into(),
            ],
        }
    }

    fn detect_project(&self, path: &Path) -> bool {
        path.join("project.godot").exists()
    }

    fn suggest_clusters(&self, nodes: &[GraphNode]) -> Vec<ClusteringHint> {
        let mut hints = Vec::new();
        // Group files by their base name (stem): player.tscn + player.gd +
        // player.tres are almost certainly the same logical entity.
        let mut name_groups: HashMap<String, Vec<String>> = HashMap::new();

        for node in nodes {
            if node.node_type == NodeType::File {
                if let Some(ref path_str) = node.file_path {
                    if let Some(stem) = Path::new(path_str).file_stem().and_then(|s| s.to_str()) {
                        name_groups
                            .entry(stem.to_string())
                            .or_default()
                            .push(node.id.clone());
                    }
                }
            }
        }

        for (stem, ids) in name_groups {
            if ids.len() >= 2 {
                hints.push(ClusteringHint {
                    suggested_label: stem.clone(),
                    member_node_ids: ids,
                    confidence: 0.8,
                    reason: format!("Same base name '{stem}' with different Godot extensions"),
                });
            }
        }

        hints
    }
}
