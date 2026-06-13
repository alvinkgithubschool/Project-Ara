import { useAuth } from "../../hooks/useAuth";
import { SignIn } from "./SignIn";
import { UserMenu } from "./UserMenu";
import { useProject } from "../../hooks/useProject";
import { useGraph } from "../../hooks/useGraph";
import { ProjectSelect } from "../project/ProjectSelect";
import { GraphCanvas } from "../canvas/GraphCanvas";
import { Sidebar } from "../layout/Sidebar";
import { useState } from "react";

export function AuthGate() {
  const { isAuthenticated } = useAuth();
  const { project } = useProject();
  const { graph, selectedNode, scanAndLoad, selectNode } = useGraph();
  const [showCanvas, setShowCanvas] = useState(false);

  // Show sign-in immediately — session check runs in background.
  // The loading state only matters for the initial app boot.
  if (!isAuthenticated) {
    return <SignIn />;
  }

  // Authenticated — show the app
  return (
    <div style={styles.wrapper}>
      <div style={styles.userMenuBar}>
        <UserMenu />
      </div>

      {!showCanvas ? (
        <ProjectSelect
          onProjectReady={async (scannedProject) => {
            await scanAndLoad(scannedProject.rootPath);
            setShowCanvas(true);
          }}
        />
      ) : (
        <div style={styles.layout}>
          <Sidebar
            projectName={project?.name || ""}
            nodeCount={graph?.nodes.length || 0}
            edgeCount={graph?.edges.length || 0}
            onRefresh={async () => {
              if (project) await scanAndLoad(project.rootPath);
            }}
          />
          <main style={styles.main}>
            {graph ? (
              <GraphCanvas
                graph={graph}
                selectedNode={selectedNode}
                onNodeSelect={(nodeId) => {
                  if (project) selectNode(project.rootPath, nodeId);
                }}
                onNodeDeselect={() => selectNode("", "")}
              />
            ) : (
              <div style={styles.empty}>
                <p>No graph data. Try refreshing the scan.</p>
              </div>
            )}
          </main>
        </div>
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
