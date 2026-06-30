import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface FileNodeData {
  label: string;
  classification: string;
  ecosystem: string;
  folderColorIndex: number;
  tier: "full" | "partial" | "reference";
  path: string;
}

const ECOSYSTEM_ICONS: Record<string, string> = {
  godot: "🎮",
  blender: "🧊",
  unity: "⬛",
  touchdesigner: "🔌",
  cablesgl: "🔷",
  ableton: "🎵",
  unknown: "📄",
};

export const FileNode = memo(function FileNode({
  data,
  selected,
}: NodeProps & { data: FileNodeData }) {
  const ecoClass = `node--${data.ecosystem || "unknown"}`;
  const icon = ECOSYSTEM_ICONS[data.ecosystem] || ECOSYSTEM_ICONS.unknown;

  return (
    <div
      className={`file-node ${ecoClass} ${selected ? "node--selected" : ""}`}
      style={
        {
          backgroundColor: "var(--color-bg)",
          border: selected
            ? "2px solid var(--color-border-focus)"
            : "1px solid var(--color-border)",
          borderLeft: `3px solid var(--eco-${data.ecosystem || "default"})`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-2) var(--space-3)",
          fontSize: "var(--text-sm)",
          minWidth: 140,
          maxWidth: 240,
          position: "relative",
          boxShadow: selected ? "var(--shadow-md)" : "var(--shadow-sm)",
        } as React.CSSProperties
      }
    >
      <div className={`folder-tag folder-tag--${data.folderColorIndex % 8}`} />

      {data.tier !== "full" && (
        <span
          className={`tier-badge tier-badge--${data.tier}`}
          style={{ position: "absolute", top: 2, left: 4 }}
        >
          {data.tier === "partial" ? "T0" : "REF"}
        </span>
      )}

      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div>
          <div
            style={{
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.label}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
            {data.classification}
          </div>
        </div>
      </div>
    </div>
  );
});
