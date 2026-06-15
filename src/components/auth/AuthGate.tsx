import { useAuth } from "../../hooks/useAuth";
import { SignIn } from "./SignIn";
import { UserMenu } from "./UserMenu";
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
    <div style={styles.wrapper}>
      <div style={styles.userMenuBar}>
        <UserMenu />
      </div>

      {!showCanvas ? (
        <ProjectSelect onProjectReady={handleProjectReady} />
      ) : (
        <main style={styles.main}>
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
            <div style={styles.empty}>
              <p>No graph data. Try refreshing the scan.</p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  userMenuBar: {
    position: "absolute",
    top: "var(--space-4)",
    right: "var(--space-4)",
    zIndex: 100,
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
