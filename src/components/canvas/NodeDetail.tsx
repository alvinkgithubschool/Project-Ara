import type { GraphNode } from '../../core/graph';
import { NODE_TYPE_LABELS, CLASSIFICATION_LABELS } from '../../core/graph';

interface NodeDetailProps {
  node: GraphNode;
  onClose: () => void;
}

/**
 * Detail panel shown when a node is selected in the graph canvas.
 */
export function NodeDetail({ node, onClose }: NodeDetailProps) {
  const typeLabel = NODE_TYPE_LABELS[node.node_type] || node.node_type;
  const classificationLabel =
    node.classification && CLASSIFICATION_LABELS[node.classification]
      ? CLASSIFICATION_LABELS[node.classification]
      : node.classification;

  const metadataEntries = Object.entries(node.metadata).filter(
    ([, v]) => v !== null && v !== undefined,
  );

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>{node.label}</h3>
        <button style={styles.closeButton} onClick={onClose} title="Close">
          ×
        </button>
      </div>

      <div style={styles.body}>
        <div style={styles.row}>
          <span style={styles.key}>Type</span>
          <span style={styles.value}>{typeLabel}</span>
        </div>

        {classificationLabel && (
          <div style={styles.row}>
            <span style={styles.key}>Classification</span>
            <span style={styles.value}>{classificationLabel}</span>
          </div>
        )}

        {node.file_path && (
          <div style={styles.row}>
            <span style={styles.key}>Path</span>
            <span style={styles.valueMono}>{node.file_path}</span>
          </div>
        )}

        <div style={styles.row}>
          <span style={styles.key}>ID</span>
          <span style={styles.valueMono}>{node.id}</span>
        </div>

        <div style={styles.row}>
          <span style={styles.key}>Created</span>
          <span style={styles.value}>{new Date(node.created_at).toLocaleString()}</span>
        </div>

        {metadataEntries.length > 0 && (
          <div style={styles.metadataSection}>
            <h4 style={styles.metadataTitle}>Metadata</h4>
            {metadataEntries.map(([key, value]) => (
              <div key={key} style={styles.row}>
                <span style={styles.key}>{key}</span>
                <span style={styles.valueMono}>
                  {typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 320,
    height: '100%',
    backgroundColor: 'var(--color-bg)',
    borderLeft: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 50,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-4)',
    borderBottom: '1px solid var(--color-border-light)',
  },
  title: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 'var(--text-xl)',
    color: 'var(--color-text-tertiary)',
    cursor: 'pointer',
    padding: '0 var(--space-2)',
  },
  body: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
    paddingBottom: 'var(--space-2)',
    borderBottom: '1px solid var(--color-border-light)',
  },
  key: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tracking-wide)',
    flexShrink: 0,
  },
  value: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  valueMono: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-secondary)',
    textAlign: 'right',
    wordBreak: 'break-all',
  },
  metadataSection: {
    marginTop: 'var(--space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  metadataTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tracking-wide)',
  },
};
