interface CanvasToolbarProps {
  onRefresh: () => void;
  onSwitchProject: () => void;
  nodeCount: number;
  edgeCount: number;
}

/** Bottom toolbar with actions and graph stats. */
export function CanvasToolbar({
  onRefresh,
  onSwitchProject,
  nodeCount,
  edgeCount,
}: CanvasToolbarProps) {
  return (
    <div style={styles.bar}>
      <div style={styles.stats}>
        <span style={styles.stat}>
          <strong>{nodeCount}</strong> nodes
        </span>
        <span style={styles.stat}>
          <strong>{edgeCount}</strong> edges
        </span>
      </div>

      <div style={styles.actions}>
        <button
          style={styles.btn}
          onClick={onRefresh}
          title="Rescan project"
        >
          ↻ Rescan
        </button>
        <button
          style={styles.btn}
          onClick={onSwitchProject}
          title="Open a different project"
        >
          📂 Switch Project
        </button>
        <button
          style={{ ...styles.btn, ...styles.btnMuted }}
          disabled
          title="Coming soon"
        >
          + Add Link
        </button>
        <button
          style={{ ...styles.btn, ...styles.btnMuted }}
          disabled
          title="Coming soon"
        >
          🖼 Add Image
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 12px",
    backgroundColor: "var(--color-bg-secondary)",
    borderBottom: "1px solid var(--color-border-light)",
    flexShrink: 0,
    minHeight: 40,
    gap: 12,
  },
  stats: {
    display: "flex",
    gap: 16,
  },
  stat: {
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    color: "var(--color-text-secondary)",
  },
  actions: {
    display: "flex",
    gap: 6,
  },
  btn: {
    padding: "4px 10px",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnMuted: {
    color: "var(--color-text-tertiary)",
    borderStyle: "dashed",
    opacity: 0.6,
    cursor: "not-allowed",
  },
};
