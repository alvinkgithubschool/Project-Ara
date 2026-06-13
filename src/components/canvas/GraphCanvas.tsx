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
import { CLASSIFICATION_LABELS } from "../../core/graph";
import { NodeDetail } from "./NodeDetail";

interface GraphCanvasProps {
  graph: GraphSnapshot;
  selectedNode: AraNode | null;
  onNodeSelect: (nodeId: string) => void;
  onNodeDeselect: () => void;
}

/**
 * Converts Ara graph nodes/edges into ReactFlow nodes/edges.
 */
function toReactFlow(graph: GraphSnapshot): { nodes: Node[]; edges: Edge[] } {
  const nodeColor = (type: string): string => {
    switch (type) {
      case "project":
        return "#111111";
      case "folder":
        return "#555555";
      case "file":
        return "#888888";
      case "parsed_entity":
        return "#aaaaaa";
      default:
        return "#999999";
    }
  };

  const nodes: Node[] = graph.nodes.map((n, i) => {
    const col = nodeColor(n.node_type);
    const classificationLabel =
      n.classification && CLASSIFICATION_LABELS[n.classification]
        ? `\n${CLASSIFICATION_LABELS[n.classification]}`
        : "";

    return {
      id: n.id,
      position: {
        x: (i % 8) * 200 + 50,
        y: Math.floor(i / 8) * 120 + 50,
      },
      data: {
        label: `${n.label}${classificationLabel}`,
      },
      style: {
        backgroundColor: "#ffffff",
        border: `2px solid ${col}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-3) var(--space-4)",
        fontSize: "var(--text-sm)",
        fontFamily: "var(--font-sans)",
        color: "var(--color-text)",
        whiteSpace: "pre-line",
        maxWidth: 220,
      },
    };
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source_id,
    target: e.target_id,
    label: e.label || e.edge_type,
    type: "smoothstep",
    style: {
      stroke: "#cccccc",
      strokeWidth: 1,
    },
    labelStyle: {
      fontSize: 10,
      fill: "#888888",
    },
  }));

  return { nodes, edges };
}

/**
 * The graph canvas component. Renders the Ara graph using ReactFlow
 * with pan/zoom, node selection, and minimap.
 */
export function GraphCanvas({
  graph,
  selectedNode,
  onNodeSelect,
  onNodeDeselect,
}: GraphCanvasProps) {
  const initialElements = useMemo(() => toReactFlow(graph), [graph]);
  const [nodes, , onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initialElements.edges);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeDeselect();
  }, [onNodeDeselect]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.flow}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background color="#e5e5e5" gap={24} />
          <MiniMap
            nodeColor={(n) => {
              const type = graph.nodes.find((gn) => gn.id === n.id)?.node_type;
              if (type === "project") return "#111111";
              if (type === "folder") return "#555555";
              if (type === "parsed_entity") return "#aaaaaa";
              return "#cccccc";
            }}
            maskColor="rgba(0,0,0,0.08)"
          />
        </ReactFlow>
      </div>

      {selectedNode && (
        <NodeDetail node={selectedNode} onClose={onNodeDeselect} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    flex: 1,
    display: "flex",
    position: "relative",
    height: "100%",
  },
  flow: {
    flex: 1,
    height: "100%",
  },
};
