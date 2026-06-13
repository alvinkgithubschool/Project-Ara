/** Core graph types — mirrors the Rust `graph::types` module. */

export type NodeType = "project" | "folder" | "file" | "parsed_entity";

export type EdgeType =
  | "contains"
  | "uses"
  | "derived_from"
  | "inspired_by"
  | "discuss";

export interface GraphNode {
  id: string;
  node_type: NodeType;
  label: string;
  file_path: string | null;
  classification: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GraphEdge {
  id: string;
  edge_type: EdgeType;
  source_id: string;
  target_id: string;
  label: string | null;
  metadata: Record<string, unknown>;
}

export interface GraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Maps the Rust `NodeType` to a human-readable label. */
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  project: "Project",
  folder: "Folder",
  file: "File",
  parsed_entity: "Parsed Entity",
};

/** Maps classification strings to display labels. */
export const CLASSIFICATION_LABELS: Record<string, string> = {
  godot_scene: "Godot Scene",
  godot_script: "Godot Script",
  godot_resource: "Godot Resource (ext)",
  godot_project: "Godot Project",
  shader_glsl: "GLSL Shader",
  shader_hlsl: "HLSL Shader",
  shader_cg: "Cg Shader",
  unity_scene: "Unity Scene",
  unity_asset: "Unity Asset",
  unity_prefab: "Unity Prefab",
  unreal_project: "Unreal Project",
  touchdesigner: "TouchDesigner",
  ableton_session: "Ableton Session",
  flstudio_project: "FL Studio Project",
  logic_pro: "Logic Pro",
  reaper_project: "Reaper Project",
  processing_sketch: "Processing Sketch",
  threejs_script: "Three.js",
  source_code: "Source Code",
  markdown: "Markdown",
  image: "Image",
  audio: "Audio",
  video: "Video",
  model: "3D Model",
  unknown: "Unknown",
  godot_scene_node: "Scene Node",
  shader_include: "Shader Include",
  code_dependency: "Code Dependency",
};
