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
  const { graph, isLoading, error, scanAndLoad, selectNode } = useGraph();
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
          {isLoading && (
            <div style={s.status}>
              <p>Scanning project…</p>
            </div>
          )}
          {error && (
            <div style={s.errorBanner}>
              <p>Error: {error}</p>
              <button style={s.retryBtn} onClick={handleRefresh}>
                Retry
              </button>
              <button style={s.retryBtn} onClick={handleSwitchProject}>
                Switch project
              </button>
            </div>
          )}
          {!isLoading && !error && graph && (
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
          )}
          {!isLoading && !error && !graph && (
            <div style={s.empty}>
              <p>No graph data loaded.</p>
              <button style={s.retryBtn} onClick={handleRefresh}>
                Retry scan
              </button>
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
  status: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "var(--color-text-secondary)",
    fontSize: 14,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 12,
    color: "var(--color-text-tertiary)",
  },
  errorBanner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 12,
    color: "var(--color-error)",
    padding: 20,
    textAlign: "center",
  },
  retryBtn: {
    padding: "6px 16px",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    marginTop: 8,
  },
};
