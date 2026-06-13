import { useProject } from "../../hooks/useProject";
import { open } from "@tauri-apps/plugin-dialog";
import type { ProjectInfo } from "../../core/project";

interface ProjectSelectProps {
  onProjectReady: (project: ProjectInfo) => void;
}

/**
 * Project selection screen. Allows the user to pick a folder,
 * bootstraps the .ara/ directory, and passes control to the parent.
 */
export function ProjectSelect({ onProjectReady }: ProjectSelectProps) {
  const { selectProject, isLoading, error } = useProject();

  const handleSelectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select a project folder",
    });

    if (selected && typeof selected === "string") {
      const project = await selectProject(selected);
      if (project) {
        onProjectReady(project);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Open a Project</h2>
        <p style={styles.description}>
          Select a folder to open as a Project Ara workspace. Ara will create a{" "}
          <code>.ara/</code> directory inside it to store the project graph.
        </p>

        {error && <p style={styles.errorBanner}>{error}</p>}

        <button
          style={{
            ...styles.selectButton,
            ...(isLoading ? styles.selectButtonDisabled : {}),
          }}
          onClick={handleSelectFolder}
          disabled={isLoading}
        >
          {isLoading ? "Setting up…" : "Select Project Folder"}
        </button>

        <p style={styles.hint}>
          The first scan builds the graph and stores it in{" "}
          <code>.ara/graph.db</code>.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--space-6)",
    padding: "var(--space-10)",
    maxWidth: 480,
    width: "100%",
    textAlign: "center",
  },
  title: {
    fontSize: "var(--text-2xl)",
    fontWeight: "var(--font-bold)",
  },
  description: {
    color: "var(--color-text-secondary)",
    fontSize: "var(--text-sm)",
    lineHeight: "var(--leading-relaxed)",
  },
  selectButton: {
    padding: "var(--space-3) var(--space-8)",
    backgroundColor: "var(--color-accent)",
    color: "var(--color-text-inverse)",
    border: "none",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--text-base)",
    fontWeight: "var(--font-medium)",
    cursor: "pointer",
    transition: "opacity var(--transition-fast)",
  },
  selectButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  hint: {
    color: "var(--color-text-tertiary)",
    fontSize: "var(--text-xs)",
  },
  errorBanner: {
    color: "var(--color-error)",
    fontSize: "var(--text-sm)",
    padding: "var(--space-2) var(--space-3)",
    backgroundColor: "var(--color-bg-secondary)",
    borderRadius: "var(--radius-sm)",
    width: "100%",
  },
};
