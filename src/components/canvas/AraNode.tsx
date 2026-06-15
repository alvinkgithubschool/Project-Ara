import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import type { GraphNode as AraNode } from "../../core/graph";

const TYPE_COLORS: Record<string, { border: string; bg: string }> = {
  project: { border: "#1a1a1a", bg: "rgba(0,0,0,0.04)" },
  folder: { border: "#555555", bg: "rgba(80,80,80,0.04)" },
  file: { border: "#666666", bg: "rgba(100,100,100,0.03)" },
  parsed_entity: { border: "#888888", bg: "rgba(130,130,130,0.02)" },
};

const SHORT_LABELS: Record<string, string> = {
  godot_scene: "Scene",
  godot_script: "Script",
  godot_resource: "Resource",
  shader_glsl: "GLSL",
  shader_hlsl: "HLSL",
  shader_cg: "Cg",
  source_code: "Code",
  markdown: "Doc",
  image: "Image",
  audio: "Audio",
  video: "Video",
  model: "3D",
  godot_scene_node: "Node",
  shader_include: "Include",
  code_dependency: "Dep",
  unity_scene: "Scene",
  unity_prefab: "Prefab",
  unreal_project: "UE",
  touchdesigner: "TD",
  ableton_session: "Ableton",
  processing_sketch: "P5",
};

export function AraNode({ data, selected }: NodeProps) {
  const araNode = data.araNode as AraNode | undefined;
  const nodeType = araNode?.node_type ?? "file";
  const classification = araNode?.classification ?? "";
  const colors = TYPE_COLORS[nodeType] ?? TYPE_COLORS.file;
  const shortLabel =
    SHORT_LABELS[classification] || classification.replace(/_/g, " ");
  const label = String(araNode?.label ?? data.label ?? "");
  const ext = araNode?.metadata?.extension as string | undefined;
  const size = araNode?.metadata?.size as number | undefined;
  const sizeStr = size ? formatSize(size) : "";

  return (
    <div
      style={{
        ...s.container,
        borderColor: colors.border,
        backgroundColor: "#fff",
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: "#333",
          border: "2px solid #fff",
        }}
        lineStyle={{ borderColor: "#333" }}
      />
      <Handle type="target" position={Position.Top} style={s.handle} />
      <Handle type="source" position={Position.Bottom} style={s.handle} />
      <div style={s.preview}>
        {nodeType === "project" && <Preview icon="📁" text="Project" />}
        {nodeType === "folder" && <Preview icon="📂" />}
        {classification === "image" && <Preview icon="🖼" text={label} />}
        {classification === "model" && <Preview icon="🧊" text={label} />}
        {classification === "audio" && <Preview icon="🎵" text={label} />}
        {classification === "video" && <Preview icon="🎬" text={label} />}
        {(classification === "source_code" ||
          classification === "godot_script") && (
          <Preview icon={ext ? `.${ext}` : "</>"} />
        )}
        {(classification === "shader_glsl" ||
          classification === "shader_hlsl" ||
          classification === "shader_cg") && (
          <Preview icon="🎨" text="Shader" />
        )}
        {classification === "godot_scene" && <Preview icon="🎮" text="Scene" />}
        {nodeType === "parsed_entity" && <Preview icon="●" text={shortLabel} />}
        {!classification && nodeType === "file" && (
          <Preview icon={ext ? `.${ext}` : "📄"} />
        )}
      </div>
      <div style={s.name}>{truncate(label, 28)}</div>
      {sizeStr && <div style={s.size}>{sizeStr}</div>}
      {classification && (
        <div style={{ ...s.badge, borderTopColor: colors.border }}>
          {shortLabel}
          {ext ? `.${ext}` : ""}
        </div>
      )}
    </div>
  );
}

function Preview({ icon, text }: { icon: string; text?: string }) {
  return (
    <div style={previewBoxStyle}>
      {icon}
      {text ? ` ${truncate(text, 18)}` : ""}
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const previewBoxStyle: React.CSSProperties = {
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
  color: "var(--color-text-tertiary)",
  backgroundColor: "var(--color-bg-secondary)",
  borderRadius: 4,
  overflow: "hidden",
};

const s: Record<string, React.CSSProperties> = {
  container: {
    border: "2px solid #ccc",
    borderRadius: 8,
    padding: "6px 8px 0 8px",
    minWidth: 120,
    maxWidth: 240,
    fontFamily: "var(--font-sans)",
    fontSize: 11,
    color: "var(--color-text)",
    backgroundColor: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    cursor: "pointer",
  },
  handle: { width: 6, height: 6, backgroundColor: "#555", border: "none" },
  preview: { marginBottom: 4 },
  name: {
    fontWeight: 600,
    textAlign: "center",
    lineHeight: 1.3,
    marginBottom: 2,
    wordBreak: "break-word",
  },
  size: {
    fontSize: 9,
    fontFamily: "var(--font-mono)",
    color: "var(--color-text-tertiary)",
    textAlign: "center",
    marginBottom: 2,
  },
  badge: {
    margin: "0 -8px 0 -8px",
    padding: "3px 6px",
    fontSize: 9,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--color-text-secondary)",
    textAlign: "center",
    borderTop: "1px solid #ddd",
    backgroundColor: "rgba(0,0,0,0.02)",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
};
