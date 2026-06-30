import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface ClusterNodeData {
  label: string;
  memberCount: number;
  colorTag?: string;
  /** Drill into this cluster's sub-canvas. Wired by the integration layer. */
  onOpen?: (clusterId: string) => void;
  clusterId?: string;
}

type ClusterNodeProps = NodeProps & { data: ClusterNodeData };

export const ClusterNode = memo(function ClusterNode({ data, selected }: ClusterNodeProps) {
  const accent = data.colorTag || "var(--color-accent)";

  return (
    <div
      className={`cluster-node ${selected ? "node--selected" : ""}`}
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        border: selected
          ? "2px solid var(--color-border-focus)"
          : "1px dashed var(--color-border)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-3) var(--space-4)",
        fontSize: "var(--text-sm)",
        minWidth: 160,
        boxShadow: selected ? "var(--shadow-md)" : "var(--shadow-sm)",
        cursor: "pointer",
      }}
      onDoubleClick={() => data.clusterId && data.onOpen?.(data.clusterId)}
      title="Double-click to open sub-canvas"
    >
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <span style={{ fontSize: 16 }}>🗂️</span>
        <div>
          <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{data.label}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
            {data.memberCount} {data.memberCount === 1 ? "item" : "items"}
          </div>
        </div>
      </div>
    </div>
  );
});
