/** Canvas state types — mirror the Rust `commands::canvas_cmd` structs. */

export interface CanvasObjectData {
  id: string;
  canvas_id: string;
  project_id: string;
  object_type: string;
  position_x: number;
  position_y: number;
  width: number | null;
  height: number | null;
  z_index: number;
  data: Record<string, unknown>;
}

export interface CanvasStateData {
  id: string;
  project_id: string;
  parent_canvas_id: string | null;
  label: string;
  viewport_x: number;
  viewport_y: number;
  viewport_zoom: number;
  objects: CanvasObjectData[];
}

/** A connection suggestion from the intelligence pipeline. */
export interface ConnectionSuggestion {
  id: string;
  suggestion_type: string;
  source_node_id: string | null;
  target_node_id: string | null;
  proposed_edge_type: string | null;
  confidence: number;
  reason: string;
  evidence: Array<{ evidence_type: string; detail: string }>;
  status: "pending" | "accepted" | "rejected" | "deferred";
}

/** A clustering hint from the intelligence pipeline. */
export interface ClusteringHint {
  suggested_label: string;
  member_node_ids: string[];
  confidence: number;
  reason: string;
}
