import type { ConnectionSuggestion } from "../../core/canvas";

interface ConnectionReportProps {
  suggestions: ConnectionSuggestion[];
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onDefer: (id: string) => void;
  onAcceptAll: () => void;
  onClose: () => void;
}

export function ConnectionReport({
  suggestions,
  onAccept,
  onDismiss,
  onDefer,
  onAcceptAll,
  onClose,
}: ConnectionReportProps) {
  const pending = suggestions.filter((s) => s.status === "pending");

  if (pending.length === 0) {
    return (
      <div style={panelStyles}>
        <div style={headerStyles}>
          <h3>Connection Report</h3>
          <button onClick={onClose} style={closeBtnStyles}>
            ×
          </button>
        </div>
        <div style={{ padding: "var(--space-4)", color: "var(--color-text-tertiary)" }}>
          No pending suggestions.
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyles}>
      <div style={headerStyles}>
        <h3>Connection Report ({pending.length})</h3>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button onClick={onAcceptAll} style={acceptAllBtnStyles}>
            Accept All
          </button>
          <button onClick={onClose} style={closeBtnStyles}>
            ×
          </button>
        </div>
      </div>
      <div style={listStyles}>
        {pending.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onAccept={() => onAccept(s.id)}
            onDismiss={() => onDismiss(s.id)}
            onDefer={() => onDefer(s.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onDefer,
}: {
  suggestion: ConnectionSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
  onDefer: () => void;
}) {
  const confPct = Math.round(suggestion.confidence * 100);
  const confColor =
    confPct >= 80
      ? "var(--eco-touchdesigner)"
      : confPct >= 50
        ? "var(--eco-ableton)"
        : "var(--eco-default)";

  return (
    <div style={cardStyles}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "var(--space-2)",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
          {suggestion.proposed_edge_type}
        </span>
        <span
          style={{
            background: `${confColor}20`,
            color: confColor,
            padding: "1px 6px",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-xs)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {confPct}%
        </span>
      </div>
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
          marginBottom: "var(--space-2)",
        }}
      >
        {suggestion.reason}
      </div>
      {suggestion.evidence && suggestion.evidence.length > 0 && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-tertiary)",
            marginBottom: "var(--space-2)",
          }}
        >
          {suggestion.evidence.map((e, i) => (
            <span key={i} style={{ marginRight: "var(--space-2)" }}>
              • {e.evidence_type}: {e.detail}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <button onClick={onAccept} style={acceptBtnStyles}>
          Accept
        </button>
        <button onClick={onDismiss} style={dismissBtnStyles}>
          Dismiss
        </button>
        <button onClick={onDefer} style={deferBtnStyles}>
          Later
        </button>
      </div>
    </div>
  );
}

const panelStyles: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  width: 360,
  height: "100%",
  backgroundColor: "var(--color-bg)",
  borderLeft: "1px solid var(--color-border)",
  boxShadow: "var(--shadow-lg)",
  zIndex: 50,
  display: "flex",
  flexDirection: "column",
};
const headerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "var(--space-4)",
  borderBottom: "1px solid var(--color-border)",
};
const listStyles: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: "var(--space-3)",
};
const cardStyles: React.CSSProperties = {
  padding: "var(--space-3)",
  border: "1px solid var(--color-border-light)",
  borderRadius: "var(--radius-md)",
  marginBottom: "var(--space-3)",
};
const closeBtnStyles: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "1.2rem",
  cursor: "pointer",
  color: "var(--color-text-tertiary)",
};
const acceptBtnStyles: React.CSSProperties = {
  padding: "2px 12px",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  backgroundColor: "var(--eco-touchdesigner)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
};
const dismissBtnStyles: React.CSSProperties = {
  ...acceptBtnStyles,
  backgroundColor: "var(--color-bg-secondary)",
  color: "var(--color-text-secondary)",
};
const deferBtnStyles: React.CSSProperties = {
  ...acceptBtnStyles,
  backgroundColor: "transparent",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-tertiary)",
};
const acceptAllBtnStyles: React.CSSProperties = {
  ...acceptBtnStyles,
  backgroundColor: "var(--eco-touchdesigner)",
};
