import { useState, useCallback, memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import ReactMarkdown from "react-markdown";

export interface NoteNodeData {
  title: string;
  body: string;
  colorTag: string;
  objectId: string;
  /** Persist callback wired by the canvas integration layer. */
  onPersist?: (objectId: string, patch: { title: string; body: string }) => void;
}

type NoteNodeProps = NodeProps & { data: NoteNodeData };

const TOOLBAR: Array<{ action: string; label: string; style: React.CSSProperties }> = [
  { action: "bold", label: "B", style: { fontWeight: "bold" } },
  { action: "italic", label: "I", style: { fontStyle: "italic" } },
  { action: "h1", label: "H1", style: {} },
  { action: "h2", label: "H2", style: {} },
  { action: "h3", label: "H3", style: {} },
  { action: "list", label: "•", style: {} },
  { action: "link", label: "🔗", style: {} },
  { action: "code", label: "<>", style: {} },
];

export const NoteNode = memo(function NoteNode({ data, selected }: NoteNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [body, setBody] = useState(data.body);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    data.onPersist?.(data.objectId, { title, body });
  }, [title, body, data]);

  const handleToolbarAction = useCallback(
    (action: string) => {
      const textarea = document.querySelector(
        `[data-note-id="${data.objectId}"]`,
      ) as HTMLTextAreaElement | null;
      const start = textarea ? textarea.selectionStart : body.length;
      const end = textarea ? textarea.selectionEnd : body.length;
      const selectedText = body.substring(start, end);
      let replacement = "";

      switch (action) {
        case "bold":
          replacement = `**${selectedText || "bold text"}**`;
          break;
        case "italic":
          replacement = `*${selectedText || "italic text"}*`;
          break;
        case "h1":
          replacement = `\n# ${selectedText || "Heading 1"}\n`;
          break;
        case "h2":
          replacement = `\n## ${selectedText || "Heading 2"}\n`;
          break;
        case "h3":
          replacement = `\n### ${selectedText || "Heading 3"}\n`;
          break;
        case "list":
          replacement = `\n- ${selectedText || "list item"}\n`;
          break;
        case "link":
          replacement = `[${selectedText || "link text"}](url)`;
          break;
        case "code":
          replacement = `\`${selectedText || "code"}\``;
          break;
      }

      setBody(body.substring(0, start) + replacement + body.substring(end));
    },
    [body, data.objectId],
  );

  return (
    <div
      className={`note-node ${selected ? "note-node--selected" : ""}`}
      style={
        {
          "--accent": data.colorTag,
          minWidth: 200,
          maxWidth: 400,
          backgroundColor: "var(--color-bg)",
          border: selected
            ? "2px solid var(--color-border-focus)"
            : "1px solid var(--color-border)",
          borderLeft: `3px solid ${data.colorTag}`,
          borderRadius: "var(--radius-md)",
          boxShadow: selected ? "var(--shadow-md)" : "var(--shadow-sm)",
          padding: "var(--space-3) var(--space-4)",
          fontSize: "var(--text-sm)",
        } as React.CSSProperties
      }
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />

      {isEditing ? (
        <div className="note-node__editor">
          <div
            style={{
              display: "flex",
              gap: "2px",
              marginBottom: "var(--space-2)",
              padding: "var(--space-1)",
              backgroundColor: "var(--color-bg-secondary)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {TOOLBAR.map((btn) => (
              <button
                key={btn.action}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-secondary)",
                }}
                onMouseDown={(e) => {
                  // Prevent the textarea from losing focus (which would close
                  // the editor) before the action runs.
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToolbarAction(btn.action);
                }}
                title={btn.action}
              >
                <span style={btn.style}>{btn.label}</span>
              </button>
            ))}
          </div>
          <input
            style={{
              width: "100%",
              border: "none",
              borderBottom: "1px solid var(--color-border-light)",
              padding: "var(--space-1) 0",
              fontSize: "var(--text-base)",
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              backgroundColor: "transparent",
              color: "var(--color-text)",
              outline: "none",
              marginBottom: "var(--space-2)",
            }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
          />
          <textarea
            data-note-id={data.objectId}
            style={{
              width: "100%",
              minHeight: 80,
              border: "none",
              resize: "vertical",
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-sans)",
              backgroundColor: "transparent",
              color: "var(--color-text)",
              outline: "none",
              lineHeight: 1.6,
            }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={handleBlur}
            placeholder="Write markdown here..."
            autoFocus
          />
        </div>
      ) : (
        <div className="note-node__preview">
          <h4
            style={{
              fontSize: "var(--text-base)",
              fontWeight: 600,
              marginBottom: "var(--space-1)",
              color: "var(--color-text)",
            }}
          >
            {title || "Untitled Note"}
          </h4>
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
              lineHeight: 1.6,
              maxHeight: 200,
              overflow: "hidden",
            }}
          >
            <ReactMarkdown>{body || "*Double-click to edit*"}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
});
