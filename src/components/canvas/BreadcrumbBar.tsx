interface BreadcrumbItem {
  id: string;
  label: string;
}

export function BreadcrumbBar({
  path,
  onNavigate,
}: {
  path: BreadcrumbItem[];
  onNavigate: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-1)",
        padding: "var(--space-2) var(--space-4)",
        backgroundColor: "var(--color-bg-secondary)",
        borderBottom: "1px solid var(--color-border-light)",
        fontSize: "var(--text-sm)",
      }}
    >
      {path.map((item, i) => (
        <span
          key={item.id}
          style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}
        >
          {i > 0 && <span style={{ color: "var(--color-text-tertiary)" }}>/</span>}
          <button
            onClick={() => onNavigate(item.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color:
                i === path.length - 1
                  ? "var(--color-text)"
                  : "var(--color-text-secondary)",
              fontWeight: i === path.length - 1 ? 600 : 400,
              fontSize: "var(--text-sm)",
            }}
          >
            {item.label}
          </button>
        </span>
      ))}
    </div>
  );
}
