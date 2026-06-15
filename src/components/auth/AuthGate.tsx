import { useAuth } from "../../hooks/useAuth";
import { SignIn } from "./SignIn";
import { useProject } from "../../hooks/useProject";
import { useGraph } from "../../hooks/useGraph";
import { ProjectSelect } from "../project/ProjectSelect";
import { GraphCanvas } from "../canvas/GraphCanvas";
import { useState } from "react";

export function AuthGate() {
  const { isAuthenticated } = useAuth();
  const { project, clearProject } = useProject();
  const { graph, scanAndLoad, selectNode } = useGraph();
  const [showCanvas, setShowCanvas] = useState(false);

  if (!isAuthenticated) return <SignIn />;

  const handleProjectReady = async (p: { rootPath: string }) => {
    await scanAndLoad(p.rootPath);
    setShowCanvas(true);
  };

  const handleRefresh = async () => {
    if (project) await scanAndLoad(project.rootPath);
  };
  const handleSwitchProject = () => {
    setShowCanvas(false);
    clearProject();
  };

  const nodeCount = graph?.nodes.length || 0;
  const edgeCount = graph?.edges.length || 0;

  return (
    <div style={s.wrapper}>
      {!showCanvas ? (
        <ProjectSelect onProjectReady={handleProjectReady} />
      ) : (
        <main style={s.main}>
          {graph ? (
            <GraphCanvas
              graph={graph}
              onNodeSelect={(nodeId) => {
                if (project) selectNode(project.rootPath, nodeId);
              }}
              onNodeDeselect={() => selectNode("", "")}
              onRefresh={handleRefresh}
              onSwitchProject={handleSwitchProject}
              nodeCount={nodeCount}
              edgeCount={edgeCount}
            />
          ) : (
            <div style={s.empty}>
              <p>No graph data. Try refreshing the scan.</p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  main: { flex: 1, height: "100%", position: "relative" },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "var(--color-text-tertiary)",
  },
};
