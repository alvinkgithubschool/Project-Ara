import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { GraphSnapshot, GraphNode as AraNode } from "../../core/graph";
import { AraNode as AraNodeComponent } from "./AraNode";
import { CanvasToolbar } from "./CanvasToolbar";

const nodeTypes = { araNode: AraNodeComponent };

/** Edge colors by type. */
const EDGE_COLORS: Record<string, string> = {
  contains: "#d4d4d4",
  uses: "#a0a0a0",
  derived_from: "#888",
  inspired_by: "#bbb",
  discuss: "#999",
};

/** Classification colors for minimap. */
const CLASS_COLORS: Record<string, string> = {
  image: "#e2e8f0",
  audio: "#fef3c7",
  video: "#fce7f3",
  model: "#dbeafe",
  source_code: "#f0fdf4",
  godot_scene: "#e0e7ff",
  godot_script: "#c7d2fe",
  shader_glsl: "#f5f5f4",
  markdown: "#fef9c3",
  folder: "#d4d4d4",
  project: "#171717",
  parsed_entity: "#e5e5e5",
};

function toReactFlow(graph: GraphSnapshot): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.nodes.map((n, i) => ({
    id: n.id,
    type: "araNode",
    position: {
      x: (i % 10) * 220 + 30,
      y: Math.floor(i / 10) * 200 + 30,
    },
    data: {
      araNode: n,
      label: n.label,
    },
  }));

  const edges: Edge[] = graph.edges.map((e) => {
    const color = EDGE_COLORS[e.edge_type] || "#d4d4d4";
    return {
      id: e.id,
      source: e.source_id,
      target: e.target_id,
      label: e.label || e.edge_type,
      type: "smoothstep",
      animated: e.edge_type === "uses" || e.edge_type === "derived_from",
      style: {
        stroke: color,
        strokeWidth: e.edge_type === "contains" ? 0.5 : 1.2,
        strokeDasharray: e.edge_type === "inspired_by" ? "5,5" : undefined,
      },
      labelStyle: { fontSize: 8, fill: "#aaa" },
      labelBgStyle: { fill: "rgba(255,255,255,0.8)" },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 2,
    };
  });

  return { nodes, edges };
}

interface GraphCanvasProps {
  graph: GraphSnapshot;
  onNodeSelect: (nodeId: string) => void;
  onNodeDeselect: () => void;
  onRefresh: () => void;
  onSwitchProject: () => void;
  nodeCount: number;
  edgeCount: number;
}

export function GraphCanvas({
  graph,
  onNodeSelect,
  onNodeDeselect,
  onRefresh,
  onSwitchProject,
  nodeCount,
  edgeCount,
}: GraphCanvasProps) {
  const initialElements = useMemo(() => toReactFlow(graph), [graph]);
  const [nodes, , onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initialElements.edges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => onNodeSelect(node.id),
    [onNodeSelect],
  );

  const minimapNodeColor = useCallback(
    (n: Node) => {
      const ara = (n.data as any)?.araNode as AraNode | undefined;
      if (ara?.node_type === "project") return "#171717";
      if (ara?.node_type === "folder") return "#d4d4d4";
      if (ara?.classification && CLASS_COLORS[ara.classification])
        return CLASS_COLORS[ara.classification];
      if (ara?.node_type === "parsed_entity") return "#e5e5e5";
      return "#e5e5e5";
    },
    [graph],
  );

  return (
    <div style={styles.wrapper}>
      {/* Toolbar */}
      <CanvasToolbar
        onRefresh={onRefresh}
        onSwitchProject={onSwitchProject}
        nodeCount={nodeCount}
        edgeCount={edgeCount}
      />

      <div style={styles.flow}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onNodeDeselect}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.05}
          maxZoom={2}
          defaultEdgeOptions={{ type: "smoothstep" }}
          attributionPosition="bottom-left"
        >
          <Controls showInteractive={false} />
          <Background color="#e5e5e5" gap={32} size={1} />
          <MiniMap
            nodeColor={minimapNodeColor}
            maskColor="rgba(0,0,0,0.06)"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    height: "100%",
  },
  flow: {
    flex: 1,
    height: "100%",
  },
};
