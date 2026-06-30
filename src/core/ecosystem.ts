/** Ecosystem registry — mirrors the Rust `intelligence::AdapterRegistry`. */

export type EcosystemTier = "full" | "partial" | "reference";

export interface EcosystemInfo {
  id: string;
  name: string;
  tier: EcosystemTier;
  description: string;
  projectMarkers: string[];
  extensions: string[];
}

export const ECOSYSTEMS: EcosystemInfo[] = [
  {
    id: "godot",
    name: "Godot Engine",
    tier: "full",
    description: "Scene parsing, script deps, resource linking, auto-clustering",
    projectMarkers: ["project.godot"],
    extensions: ["tscn", "tres", "gd", "godot", "gdshader"],
  },
  {
    id: "cablesgl",
    name: "Cables.gl",
    tier: "partial",
    description: "Patch detection, texture/asset linking, operator awareness",
    projectMarkers: ["*.cables"],
    extensions: ["cables", "js", "glsl"],
  },
  {
    id: "blender",
    name: "Blender",
    tier: "partial",
    description: "Asset detection, exported model correlation, texture mapping",
    projectMarkers: ["*.blend"],
    extensions: ["blend", "fbx", "obj", "gltf", "glb"],
  },
  {
    id: "unity",
    name: "Unity",
    tier: "partial",
    description: "Scene/prefab detection, asset classification, script dependency mapping",
    projectMarkers: ["Assets/", "ProjectSettings/"],
    extensions: ["unity", "prefab", "asset", "mat", "controller"],
  },
  {
    id: "touchdesigner",
    name: "TouchDesigner",
    tier: "partial",
    description: "Network detection, COMP hierarchy, panel component awareness",
    projectMarkers: ["*.toe"],
    extensions: ["toe", "tox"],
  },
  {
    id: "ableton",
    name: "Ableton Live",
    tier: "reference",
    description: "Session detection, audio file flagging for agent reference",
    projectMarkers: ["*.als"],
    extensions: ["als", "adg", "adv"],
  },
];

export function getEcosystemTier(ecosystemId: string): EcosystemTier {
  return ECOSYSTEMS.find((e) => e.id === ecosystemId)?.tier ?? "reference";
}

/** Resolve the ecosystem id that owns a given file extension (no dot). */
export function ecosystemForExtension(ext: string): string {
  const lower = ext.toLowerCase();
  return ECOSYSTEMS.find((e) => e.extensions.includes(lower))?.id ?? "unknown";
}
