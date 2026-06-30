//! Ecosystem-aware intelligence: adapters that detect projects, suggest
//! clusters, and infer connections. SQLite remains the source of truth; this
//! layer only produces *suggestions* the user accepts or dismisses.

// Forward-built API: `detect_project`/`extract_metadata` trait hooks and the
// registry's `detect_ecosystem`/`list_ecosystems` are wired incrementally
// (per-folder detection and the UI ecosystem toggle). Allowed until then.
#![allow(dead_code)]

pub mod adapters;
pub mod clustering;
pub mod linking;

use serde::{Deserialize, Serialize};
use std::path::Path;

/// Ecosystem support tier.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum EcosystemTier {
    /// Full Tier 0 + Tier 1 support (classification + deep parsing + clustering)
    Full,
    /// Tier 0 only (classification + file graph, no deep parsing)
    Partial,
    /// Reference only (files flagged for agent awareness, no parsing)
    Reference,
}

/// Metadata about a supported ecosystem.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EcosystemInfo {
    pub id: String,
    pub name: String,
    pub tier: EcosystemTier,
    pub description: String,
    pub project_markers: Vec<String>,
    pub extensions: Vec<String>,
}

/// A suggested grouping of related nodes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusteringHint {
    pub suggested_label: String,
    pub member_node_ids: Vec<String>,
    pub confidence: f64,
    pub reason: String,
}

/// Trait for ecosystem-specific intelligence adapters.
pub trait EcosystemAdapter: Send + Sync {
    fn ecosystem_info(&self) -> EcosystemInfo;

    /// Detect if a given path is a project root for this ecosystem.
    fn detect_project(&self, path: &Path) -> bool;

    /// Suggest clusters from a set of file nodes in this ecosystem.
    fn suggest_clusters(&self, _nodes: &[crate::graph::types::GraphNode]) -> Vec<ClusteringHint> {
        vec![]
    }

    /// Extract additional metadata from a file in this ecosystem.
    fn extract_metadata(&self, _path: &Path) -> Option<serde_json::Value> {
        None
    }
}

/// Registry of all ecosystem adapters.
pub struct AdapterRegistry {
    adapters: Vec<Box<dyn EcosystemAdapter>>,
}

impl AdapterRegistry {
    pub fn new() -> Self {
        AdapterRegistry { adapters: vec![] }
    }

    pub fn register(&mut self, adapter: Box<dyn EcosystemAdapter>) {
        self.adapters.push(adapter);
    }

    pub fn get_all(&self) -> Vec<&dyn EcosystemAdapter> {
        self.adapters.iter().map(|a| a.as_ref()).collect()
    }

    pub fn detect_ecosystem(&self, path: &Path) -> Option<String> {
        self.adapters
            .iter()
            .find(|a| a.detect_project(path))
            .map(|a| a.ecosystem_info().id.clone())
    }

    /// Get ecosystem info for all registered adapters (for the UI toggle system).
    pub fn list_ecosystems(&self) -> Vec<EcosystemInfo> {
        self.adapters.iter().map(|a| a.ecosystem_info()).collect()
    }
}

impl Default for AdapterRegistry {
    fn default() -> Self {
        Self::new()
    }
}
