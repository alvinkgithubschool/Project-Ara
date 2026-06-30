import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
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
import type { CanvasObjectData } from "../../core/canvas";
import { ecosystemForExtension, getEcosystemTier } from "../../core/ecosystem";
import { nodeTypes } from "./nodes";
import { NodeDetail } from "./NodeDetail";

interface GraphCanvasProps {
  graph: GraphSnapshot;
  selectedNode: AraNode | null;
  onNodeSelect: (nodeId: string) => void;
  onNodeDeselect: () => void;
  /** Canvas note objects to render on top of the scan graph. */
  noteObjects?: CanvasObjectData[];
  /** Double-click the empty pane to create a note here (flow coordinates). */
  onCreateNote?: (x: number, y: number) => void;
  /** Persist note title/body edits. */
  onPersistNote?: (objectId: string, patch: { title: string; body: string }) => void;
}

/** Stable 0–7 folder color index derived from a file's parent directory. */
function folderColorIndex(path: string | null): number {
  if (!path) return 0;
  const parent = path.replace(/[/\\][^/\\]*$/, "");
  let hash = 0;
  for (let i = 0; i < parent.length; i++) {
    hash = (hash * 31 + parent.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % 8;
}

function fileExtension(path: string | null): string {
  if (!path) return "";
  const m = path.match(/\.([^./\\]+)$/);
  return m ? m[1] : "";
}

/** Converts Ara graph nodes/edges into ReactFlow nodes/edges. */
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
    const position = {
      x: (i % 8) * 220 + 50,
      y: Math.floor(i / 8) * 140 + 50,
    };

    // File nodes use the custom FileNode for ecosystem/folder/tier visuals.
    if (n.node_type === "file") {
      const ecosystem = ecosystemForExtension(fileExtension(n.file_path));
      return {
        id: n.id,
        type: "file",
        position,
        data: {
          label: n.label,
          classification:
            (n.classification && CLASSIFICATION_LABELS[n.classification]) ||
            n.classification ||
            "File",
          ecosystem,
          folderColorIndex: folderColorIndex(n.file_path),
          tier: getEcosystemTier(ecosystem),
          path: n.file_path || "",
        },
      };
    }

    const col = nodeColor(n.node_type);
    const classificationLabel =
      n.classification && CLASSIFICATION_LABELS[n.classification]
        ? `\n${CLASSIFICATION_LABELS[n.classification]}`
        : "";
    return {
      id: n.id,
      position,
      data: { label: `${n.label}${classificationLabel}` },
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
    style: { stroke: "#cccccc", strokeWidth: 1 },
    labelStyle: { fontSize: 10, fill: "#888888" },
  }));

  return { nodes, edges };
}

function noteToNode(
  obj: CanvasObjectData,
  onPersist?: GraphCanvasProps["onPersistNote"],
): Node {
  const data = obj.data as { title?: string; body?: string; colorTag?: string };
  return {
    id: obj.id,
    type: "note",
    position: { x: obj.position_x, y: obj.position_y },
    data: {
      title: data.title ?? "",
      body: data.body ?? "",
      colorTag: data.colorTag ?? "#00d4ff",
      objectId: obj.id,
      onPersist,
    },
  };
}

function GraphCanvasInner({
  graph,
  selectedNode,
  onNodeSelect,
  onNodeDeselect,
  noteObjects = [],
  onCreateNote,
  onPersistNote,
}: GraphCanvasProps) {
  const rf = useReactFlow();

  const computed = useMemo(() => {
    const base = toReactFlow(graph);
    const noteNodes = noteObjects.map((o) => noteToNode(o, onPersistNote));
    return { nodes: [...base.nodes, ...noteNodes], edges: base.edges };
  }, [graph, noteObjects, onPersistNote]);

  const [nodes, setNodes, onNodesChange] = useNodesState(computed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(computed.edges);

  // Re-sync when the scan graph or note set changes (e.g. after creating a note
  // or rescanning). Preserves the "single source recompute" model.
  useEffect(() => {
    setNodes(computed.nodes);
    setEdges(computed.edges);
  }, [computed, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Note nodes manage their own editing; don't drive the scan detail panel.
      if (node.type !== "note") onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeDeselect();
  }, [onNodeDeselect]);

  const onPaneDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onCreateNote) return;
      const target = e.target as HTMLElement;
      // Only fire for the empty canvas pane, never for nodes.
      if (!target.classList.contains("react-flow__pane")) return;
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      onCreateNote(pos.x, pos.y);
    },
    [onCreateNote, rf],
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.flow} onDoubleClick={onPaneDoubleClick}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
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

      {selectedNode && <NodeDetail node={selectedNode} onClose={onNodeDeselect} />}
    </div>
  );
}

/**
 * The graph canvas component. Renders the Ara graph using ReactFlow with
 * pan/zoom, custom ecosystem-aware file nodes, markdown notes, and minimap.
 */
export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
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
