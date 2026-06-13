import { useProject } from "../../hooks/useProject";
import { useGraph } from "../../hooks/useGraph";

import { AuthGate } from "../auth/AuthGate";
import { ProjectSelect } from "../project/ProjectSelect";
import { GraphCanvas } from "../canvas/GraphCanvas";
import { Sidebar } from "./Sidebar";
import { useState } from "react";

/**
 * Main application shell. Manages the high-level flow:
 *   1. Auth (handled by AuthGate)
 *   2. Project selection
 *   3. Graph canvas with sidebar
 */
export function AppShell() {
  const { project } = useProject();
  const { graph, selectedNode, scanAndLoad, selectNode } = useGraph();
  const [showCanvas, setShowCanvas] = useState(false);

  const handleProjectReady = () => {
    setShowCanvas(true);
  };

  const handleRefresh = async () => {
    if (project) {
      await scanAndLoad(project.rootPath);
    }
  };

  const handleNodeSelect = (nodeId: string) => {
    if (project) {
      selectNode(project.rootPath, nodeId);
    }
  };

  const handleNodeDeselect = () => {
    selectNode("", "");
  };

  return (
    <AuthGate>
      {!showCanvas ? (
        <ProjectSelect onProjectReady={handleProjectReady} />
      ) : (
        <div style={styles.layout}>
          <Sidebar
            projectName={project?.name || ""}
            nodeCount={graph?.nodes.length || 0}
            edgeCount={graph?.edges.length || 0}
            onRefresh={handleRefresh}
          />
          <main style={styles.main}>
            {graph ? (
              <GraphCanvas
                graph={graph}
                selectedNode={selectedNode}
                onNodeSelect={handleNodeSelect}
                onNodeDeselect={handleNodeDeselect}
              />
            ) : (
              <div style={styles.empty}>
                <p>No graph data. Try refreshing the scan.</p>
              </div>
            )}
          </main>
        </div>
      )}
    </AuthGate>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    height: "100%",
    width: "100%",
  },
  main: {
    flex: 1,
    height: "100%",
    position: "relative",
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "var(--color-text-tertiary)",
  },
};
