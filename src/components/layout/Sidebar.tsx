interface SidebarProps {
  projectName: string;
  nodeCount: number;
  edgeCount: number;
  onRefresh: () => void;
  pendingConnections?: number;
  onOpenConnections?: () => void;
  onAddNote?: () => void;
  onOpenSettings?: () => void;
  spacetimeConnected?: boolean;
  spacetimeLabel?: string;
}

/**
 * Sidebar showing project info, graph stats, and controls.
 */
export function Sidebar({
  projectName,
  nodeCount,
  edgeCount,
  onRefresh,
  pendingConnections = 0,
  onOpenConnections,
  onAddNote,
  onOpenSettings,
  spacetimeConnected = false,
  spacetimeLabel = "SpacetimeDB",
}: SidebarProps) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.branding}>
        <h2 style={styles.logo}>Ara</h2>
        <p style={styles.projectName}>{projectName}</p>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{nodeCount}</span>
          <span style={styles.statLabel}>Nodes</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{edgeCount}</span>
          <span style={styles.statLabel}>Edges</span>
        </div>
      </div>

      <div style={styles.actions}>
        <button style={styles.actionButton} onClick={onRefresh}>
          Rescan Project
        </button>
        {onAddNote && (
          <button style={styles.actionButton} onClick={onAddNote}>
            + Add Note
          </button>
        )}
        {onOpenConnections && (
          <button style={styles.actionButton} onClick={onOpenConnections}>
            Connections{pendingConnections > 0 ? ` (${pendingConnections})` : ""}
          </button>
        )}
        {onOpenSettings && (
          <button style={styles.actionButton} onClick={onOpenSettings}>
            Settings
          </button>
        )}
      </div>

      <div style={styles.footer}>
        <div style={styles.stdbRow}>
          <span
            style={{
              ...styles.stdbDot,
              backgroundColor: spacetimeConnected
                ? "var(--eco-touchdesigner)"
                : "var(--color-text-tertiary)",
            }}
          />
          <span style={styles.footerText}>{spacetimeLabel}</span>
        </div>
        <p style={styles.footerText}>
          Graph stored in <code>.ara/graph.db</code>
        </p>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100%',
    backgroundColor: 'var(--color-bg-secondary)',
    borderRight: '1px solid var(--color-border-light)',
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-4)',
    gap: 'var(--space-6)',
    flexShrink: 0,
  },
  branding: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  logo: {
    fontSize: 'var(--text-xl)',
    fontWeight: 'var(--font-bold)',
    letterSpacing: 'var(--tracking-tight)',
  },
  projectName: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stats: {
    display: 'flex',
    gap: 'var(--space-3)',
  },
  stat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-3)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-light)',
  },
  statValue: {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--font-bold)',
    fontFamily: 'var(--font-mono)',
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tracking-wide)',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  actionButton: {
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--color-border-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  stdbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  stdbDot: {
    width: 8,
    height: 8,
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
  },
  footerText: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-tertiary)',
    lineHeight: 'var(--leading-relaxed)',
  },
};
