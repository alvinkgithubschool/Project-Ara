interface BottomBarProps {
  onAddNote: () => void;
  onAddImage: () => void;
  onAddLink: () => void;
  onFitView: () => void;
  zoom: number;
}

/**
 * Floating bottom toolbar — like Figma/Milanote.
 * Centered, rounded, with tool buttons.
 */
export function BottomBar({ onAddNote, onAddImage, onAddLink, onFitView, zoom }: BottomBarProps) {
  return (
    <div style={s.wrapper}>
      <div style={s.bar}>
        <button style={s.btn} onClick={onAddNote} title="Add note">
          📝 Note
        </button>
        <button style={s.btn} onClick={onAddImage} title="Add image">
          🖼 Image
        </button>
        <button style={s.btn} onClick={onAddLink} title="Add link between nodes">
          🔗 Link
        </button>
        <div style={s.divider} />
        <button style={s.btn} onClick={onFitView} title="Fit all nodes to view">
          ⊞ Fit
        </button>
        <span style={s.zoom}>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 50,
    pointerEvents: "none",
  },
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 10px",
    backgroundColor: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    boxShadow: "var(--shadow-md)",
    pointerEvents: "auto",
  },
  btn: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    color: "var(--color-text-secondary)",
    border: "none",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "var(--color-border-light)",
    margin: "0 4px",
  },
  zoom: {
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    color: "var(--color-text-tertiary)",
    padding: "0 6px",
    minWidth: 40,
    textAlign: "center",
  },
};
