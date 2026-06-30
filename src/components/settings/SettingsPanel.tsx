import { useEffect, useState } from "react";
import * as commands from "../../adapters/tauri/commands";
import type { SpacetimeStatus } from "../../adapters/tauri/commands";

type ThemeMode = "system" | "dark" | "light";

const THEME_KEY = "ara-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = mode;
  }
}

/** Read the persisted theme and apply it on app boot. */
export function initTheme() {
  const stored = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "system";
  applyTheme(stored);
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [theme, setTheme] = useState<ThemeMode>(
    (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "system",
  );
  const [stdb, setStdb] = useState<SpacetimeStatus | null>(null);
  const [agentEndpoint, setAgentEndpoint] = useState(
    localStorage.getItem("ara-agent-endpoint") ?? "",
  );
  const [agentEnabled, setAgentEnabled] = useState(
    localStorage.getItem("ara-agent-enabled") === "true",
  );

  useEffect(() => {
    commands.getSpacetimedbStatus().then(setStdb).catch(() => setStdb(null));
  }, []);

  const onThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
  };

  const onAgentEndpointChange = (v: string) => {
    setAgentEndpoint(v);
    localStorage.setItem("ara-agent-endpoint", v);
  };

  const onAgentEnabledChange = (v: boolean) => {
    setAgentEnabled(v);
    localStorage.setItem("ara-agent-enabled", String(v));
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>Settings</h3>
          <button onClick={onClose} style={styles.close}>
            ×
          </button>
        </div>

        {/* SpacetimeDB status */}
        <section style={styles.section}>
          <h4 style={styles.sectionTitle}>SpacetimeDB</h4>
          <div style={styles.row}>
            <span
              style={{
                ...styles.dot,
                backgroundColor: stdb?.connected
                  ? "var(--eco-touchdesigner)"
                  : "var(--color-text-tertiary)",
              }}
            />
            <span style={{ fontSize: "var(--text-sm)" }}>
              {stdb
                ? stdb.connected
                  ? `Connected — ${stdb.module}`
                  : `Wired (not synced) — ${stdb.module ?? "local"}`
                : "Unavailable"}
            </span>
          </div>
          {stdb?.uri && (
            <p style={styles.hint}>
              <code>{stdb.uri}</code> · SQLite remains the source of truth.
            </p>
          )}
        </section>

        {/* Theme */}
        <section style={styles.section}>
          <h4 style={styles.sectionTitle}>Theme</h4>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {(["system", "dark", "light"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onThemeChange(mode)}
                style={{
                  ...styles.themeBtn,
                  ...(theme === mode ? styles.themeBtnActive : {}),
                }}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Agent configuration */}
        <section style={styles.section}>
          <h4 style={styles.sectionTitle}>Agent Configuration</h4>
          <label style={styles.label}>MCP endpoint</label>
          <input
            style={styles.input}
            value={agentEndpoint}
            onChange={(e) => onAgentEndpointChange(e.target.value)}
            placeholder="http://localhost:8080/mcp"
          />
          <label style={{ ...styles.row, marginTop: "var(--space-2)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={agentEnabled}
              onChange={(e) => onAgentEnabledChange(e.target.checked)}
            />
            <span style={{ fontSize: "var(--text-sm)" }}>Enable agent context provisioning</span>
          </label>
          <p style={styles.hint}>
            Read-only by default: the agent can read graph/canvas state but cannot
            execute tool actions.
          </p>
        </section>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  panel: {
    width: 420,
    maxWidth: "90vw",
    maxHeight: "85vh",
    overflow: "auto",
    backgroundColor: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    padding: "var(--space-5)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--space-4)",
  },
  close: {
    background: "none",
    border: "none",
    fontSize: "1.4rem",
    cursor: "pointer",
    color: "var(--color-text-tertiary)",
  },
  section: {
    marginBottom: "var(--space-5)",
    paddingBottom: "var(--space-4)",
    borderBottom: "1px solid var(--color-border-light)",
  },
  sectionTitle: {
    fontSize: "var(--text-sm)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wide)",
    color: "var(--color-text-secondary)",
    marginBottom: "var(--space-3)",
  },
  row: { display: "flex", alignItems: "center", gap: "var(--space-2)" },
  dot: { width: 8, height: 8, borderRadius: "var(--radius-full)" },
  hint: {
    fontSize: "var(--text-xs)",
    color: "var(--color-text-tertiary)",
    marginTop: "var(--space-2)",
    lineHeight: 1.5,
  },
  themeBtn: {
    flex: 1,
    padding: "var(--space-2)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-sm)",
  },
  themeBtnActive: {
    backgroundColor: "var(--color-accent)",
    color: "var(--color-text-inverse)",
    borderColor: "var(--color-accent)",
  },
  label: {
    display: "block",
    fontSize: "var(--text-xs)",
    color: "var(--color-text-tertiary)",
    marginBottom: "var(--space-1)",
  },
  input: {
    width: "100%",
    padding: "var(--space-2) var(--space-3)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-mono)",
  },
};
