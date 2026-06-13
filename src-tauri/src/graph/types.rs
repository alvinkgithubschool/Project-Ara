use serde::{Deserialize, Serialize};

/// Core node types in the Ara graph.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum NodeType {
    Project,
    Folder,
    File,
    ParsedEntity,
}

impl NodeType {
    pub fn as_str(&self) -> &'static str {
        match self {
            NodeType::Project => "project",
            NodeType::Folder => "folder",
            NodeType::File => "file",
            NodeType::ParsedEntity => "parsed_entity",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "project" => Some(NodeType::Project),
            "folder" => Some(NodeType::Folder),
            "file" => Some(NodeType::File),
            "parsed_entity" => Some(NodeType::ParsedEntity),
            _ => None,
        }
    }
}

/// Core edge (relationship) types in the Ara graph.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum EdgeType {
    Contains,
    Uses,
    DerivedFrom,
    InspiredBy,
    Discuss,
}

impl EdgeType {
    pub fn as_str(&self) -> &'static str {
        match self {
            EdgeType::Contains => "contains",
            EdgeType::Uses => "uses",
            EdgeType::DerivedFrom => "derived_from",
            EdgeType::InspiredBy => "inspired_by",
            EdgeType::Discuss => "discuss",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "contains" => Some(EdgeType::Contains),
            "uses" => Some(EdgeType::Uses),
            "derived_from" => Some(EdgeType::DerivedFrom),
            "inspired_by" => Some(EdgeType::InspiredBy),
            "discuss" => Some(EdgeType::Discuss),
            _ => None,
        }
    }
}

/// Classification labels for file detection (Tier 0).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum FileClassification {
    GodotScene,
    GodotScript,
    GodotResource,
    GodotProject,
    ShaderGlsl,
    ShaderHlsl,
    ShaderCg,
    UnityScene,
    UnityAsset,
    UnityPrefab,
    UnrealProject,
    TouchDesigner,
    AbletonSession,
    FLStudioProject,
    LogicProSession,
    ReaperProject,
    ProcessingSketch,
    ThreeJsScript,
    SourceCode,
    Markdown,
    Image,
    Audio,
    Video,
    Model,
    Unknown,
}

impl FileClassification {
    pub fn as_str(&self) -> &'static str {
        match self {
            FileClassification::GodotScene => "godot_scene",
            FileClassification::GodotScript => "godot_script",
            FileClassification::GodotResource => "godot_resource",
            FileClassification::GodotProject => "godot_project",
            FileClassification::ShaderGlsl => "shader_glsl",
            FileClassification::ShaderHlsl => "shader_hlsl",
            FileClassification::ShaderCg => "shader_cg",
            FileClassification::UnityScene => "unity_scene",
            FileClassification::UnityAsset => "unity_asset",
            FileClassification::UnityPrefab => "unity_prefab",
            FileClassification::UnrealProject => "unreal_project",
            FileClassification::TouchDesigner => "touchdesigner",
            FileClassification::AbletonSession => "ableton_session",
            FileClassification::FLStudioProject => "flstudio_project",
            FileClassification::LogicProSession => "logic_pro",
            FileClassification::ReaperProject => "reaper_project",
            FileClassification::ProcessingSketch => "processing_sketch",
            FileClassification::ThreeJsScript => "threejs_script",
            FileClassification::SourceCode => "source_code",
            FileClassification::Markdown => "markdown",
            FileClassification::Image => "image",
            FileClassification::Audio => "audio",
            FileClassification::Video => "video",
            FileClassification::Model => "model",
            FileClassification::Unknown => "unknown",
        }
    }
}

/// A node in the Ara graph.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub node_type: NodeType,
    pub label: String,
    pub file_path: Option<String>,
    pub classification: Option<String>,
    pub metadata: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
}

/// An edge in the Ara graph.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub id: String,
    pub edge_type: EdgeType,
    pub source_id: String,
    pub target_id: String,
    pub label: Option<String>,
    pub metadata: serde_json::Value,
}

/// A combined graph snapshot for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphSnapshot {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}
