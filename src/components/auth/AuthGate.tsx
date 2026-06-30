import { useAuth } from "../../hooks/useAuth";
import { SignIn } from "./SignIn";
import { UserMenu } from "./UserMenu";
import { useProject } from "../../hooks/useProject";
import { useGraph } from "../../hooks/useGraph";
import { useCanvas } from "../../hooks/useCanvas";
import { useIntelligence } from "../../hooks/useIntelligence";
import { ProjectSelect } from "../project/ProjectSelect";
import { GraphCanvas } from "../canvas/GraphCanvas";
import { BreadcrumbBar } from "../canvas/BreadcrumbBar";
import { ConnectionReport } from "../canvas/ConnectionReport";
import { Sidebar } from "../layout/Sidebar";
import { SettingsPanel } from "../settings/SettingsPanel";
import * as commands from "../../adapters/tauri/commands";
import type { SpacetimeStatus } from "../../adapters/tauri/commands";
import { useEffect, useRef, useState } from "react";

export function AuthGate() {
  const { isAuthenticated } = useAuth();
  const { project } = useProject();
  const { graph, selectedNode, scanAndLoad, selectNode } = useGraph();
  const [showCanvas, setShowCanvas] = useState(false);

  const projectId = project?.rootPath ?? "";
  const canvas = useCanvas(projectId);
  const intel = useIntelligence();

  const [showConnections, setShowConnections] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stdb, setStdb] = useState<SpacetimeStatus | null>(null);
  const connectionsDismissed = useRef(false);

  // Seed/load the project's root canvas once we enter the canvas view.
  useEffect(() => {
    if (showCanvas && projectId) {
      canvas.ensureRootCanvas().catch((e) => console.error("canvas init failed:", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCanvas, projectId]);

  // Fetch the SpacetimeDB wiring status for the sidebar/settings indicator.
  useEffect(() => {
    commands.getSpacetimedbStatus().then(setStdb).catch(() => setStdb(null));
  }, []);

  // Auto-open the Connection Report the first time suggestions arrive.
  useEffect(() => {
    if (intel.pendingCount > 0 && !connectionsDismissed.current) {
      setShowConnections(true);
    }
  }, [intel.pendingCount]);

  if (!isAuthenticated) {
    return <SignIn />;
  }

  const noteObjects =
    canvas.currentCanvas?.objects.filter((o) => o.object_type === "note") ?? [];

  const breadcrumb = canvas.canvasStack.map((c) => ({ id: c.id, label: c.label }));

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
            onAddNote={() => canvas.createNote(120, 120)}
            pendingConnections={intel.pendingCount}
            onOpenConnections={() => {
              connectionsDismissed.current = false;
              setShowConnections(true);
            }}
            onOpenSettings={() => setShowSettings(true)}
            spacetimeConnected={stdb?.connected ?? false}
            spacetimeLabel={
              stdb
                ? stdb.connected
                  ? `SpacetimeDB: connected`
                  : `SpacetimeDB: wired (not synced)`
                : "SpacetimeDB: unavailable"
            }
          />
          <main style={styles.main}>
            {breadcrumb.length > 0 && (
              <BreadcrumbBar path={breadcrumb} onNavigate={canvas.navigateTo} />
            )}
            <div style={styles.canvasArea}>
              {graph ? (
                <GraphCanvas
                  graph={graph}
                  selectedNode={selectedNode}
                  onNodeSelect={(nodeId) => {
                    if (project) selectNode(project.rootPath, nodeId);
                  }}
                  onNodeDeselect={() => selectNode("", "")}
                  noteObjects={noteObjects}
                  onCreateNote={(x, y) => canvas.createNote(x, y)}
                  onPersistNote={canvas.persistNote}
                />
              ) : (
                <div style={styles.empty}>
                  <p>No graph data. Try refreshing the scan.</p>
                </div>
              )}

              {showConnections && (
                <ConnectionReport
                  suggestions={intel.suggestions}
                  onAccept={intel.onAccept}
                  onDismiss={intel.onDismiss}
                  onDefer={intel.onDefer}
                  onAcceptAll={intel.onAcceptAll}
                  onClose={() => {
                    connectionsDismissed.current = true;
                    setShowConnections(false);
                  }}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
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
    display: "flex",
    flexDirection: "column",
  },
  canvasArea: {
    flex: 1,
    position: "relative",
    minHeight: 0,
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "var(--color-text-tertiary)",
  },
};
