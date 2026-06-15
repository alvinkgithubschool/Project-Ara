import { useAuth } from "../../hooks/useAuth";

interface TopToolbarProps {
  onRefresh: () => void;
  onSwitchProject: () => void;
  nodeCount: number;
  edgeCount: number;
}

export function TopToolbar({ onRefresh, onSwitchProject, nodeCount, edgeCount }: TopToolbarProps) {
  const { user, signOut } = useAuth();

  return (
    <div style={s.bar}>
      <div style={s.left}>
        <span style={s.brand}>Ara</span>
        <span style={s.stat}><b>{nodeCount}</b> nodes</span>
        <span style={s.stat}><b>{edgeCount}</b> edges</span>
        <button style={s.btn} onClick={onRefresh}>↻ Rescan</button>
        <button style={s.btn} onClick={onSwitchProject}>📂 Switch</button>
      </div>
      <div style={s.right}>
        {user && <span style={s.user}>{user.name || user.email}</span>}
        <button style={{ ...s.btn, ...s.outlineBtn }} onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "6px 14px", backgroundColor: "var(--color-bg-secondary)",
    borderBottom: "1px solid var(--color-border-light)", flexShrink: 0, minHeight: 40, gap: 12,
  },
  left: { display: "flex", alignItems: "center", gap: 12 },
  right: { display: "flex", alignItems: "center", gap: 10 },
  brand: { fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" },
  stat: { fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" },
  user: { fontSize: 12, color: "var(--color-text-tertiary)" },
  btn: {
    padding: "4px 10px", backgroundColor: "var(--color-bg)", color: "var(--color-text)",
    border: "1px solid var(--color-border)", borderRadius: 4, fontSize: 11, fontWeight: 500,
    fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap",
  },
  outlineBtn: {
    backgroundColor: "transparent", borderColor: "var(--color-border-light)",
    color: "var(--color-text-secondary)",
  },
};
