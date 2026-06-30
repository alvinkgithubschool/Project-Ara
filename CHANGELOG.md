# Changelog

All notable changes to Project Ara.

## [0.2.0] — 2026-06-30

### Added (Demo-ready sprint)

- **SpacetimeDB wiring (stub)**: `src-tauri/src/spacetimedb/` models connection
  state and exposes `get_spacetimedb_status`. SQLite remains the source of
  truth — "wired, not synced". The real server module lives in the separate
  `spacetime-module/` crate (published via the `spacetime` CLI, outside the app
  build).
- **Global projects database**: `projects.db` (in the app data dir) with
  `projects`, `linked_folders`, `canvas_state`, `canvas_objects`, and
  `agent_configs` tables, initialized on launch.
- **Canvas state CRUD**: `commands/canvas_cmd.rs` — upsert/load/delete canvas
  objects, upsert canvas state, save viewport (Tauri IPC).
- **Ecosystem intelligence**: `src-tauri/src/intelligence/` — `EcosystemAdapter`
  trait + registry, a Full-tier Godot adapter (name-based clustering), a
  clustering engine, and a connection-inference (linking) engine. The scan
  pipeline now emits `intelligence:clusters` and `intelligence:suggestions`.
- **Markdown notes**: `NoteNode` with edit/preview modes and a formatting
  toolbar (bold/italic/H1–H3/list/link/code), via `react-markdown`. Notes
  persist to `projects.db`.
- **Custom canvas nodes**: `FileNode` (ecosystem-colored border, folder corner
  tag, tier badge) and `ClusterNode`, registered with ReactFlow `nodeTypes`.
- **Connection Report**: slide-over panel with accept/dismiss/defer/accept-all.
- **Ecosystem toggle system**: `core/ecosystem.ts` mirrors the Rust registry
  (Godot Full; Cables.gl/Blender/Unity/TouchDesigner Partial; Ableton Reference).
- **Sub-canvas navigation**: `BreadcrumbBar` + `useCanvas` (root canvas seeding,
  navigate/back, note creation/persistence).
- **Settings panel**: theme toggle (System/Dark/Light via `[data-theme]`),
  SpacetimeDB status indicator, and an agent/MCP endpoint configuration section.
- **Auth server: production database**: `server/auth.js` uses PostgreSQL (`pg`)
  when `NODE_ENV=production` + `DATABASE_URL` is set, SQLite otherwise. CORS
  origins are now env-driven (`CORS_ORIGIN`). Added `server/render.yaml`
  (Render Blueprint) and `server/Dockerfile`.

### Notes

- Deviation from the sprint plan: `spacetimedb-sdk` is **not** added to the
  Tauri crate (build-risk avoidance). The app-side module is a self-contained
  stub; the real SDK lives only in `spacetime-module/`. See `FIXLIST.md`.

## [0.1.0] — 2026-06-13

### Added (Vertical Slice 01)

- **Better Auth integration**: Replaced custom Rust auth with Better Auth server + React client.
- **Auth server**: Node.js/Hono server running Better Auth with SQLite storage (`ara_auth.db`).
- **Email/password auth**: Sign-up and sign-in via Better Auth's built-in email provider.
- **OAuth (GitHub + Google)**: Social sign-in via Better Auth's social providers.
- **2FA (TOTP)**: Two-factor authentication via Better Auth's twoFactor plugin.
- **Passkey/WebAuthn**: Platform authenticator support via `@better-auth/passkey` plugin.
- **Session management**: Handled entirely by Better Auth with 30-day expiry.
- **Project selection**: Native folder picker via tauri-plugin-dialog.
- **`.ara/` bootstrap**: Creates `.ara/` with `graph.db`, `config.toml`, and `cache/` directory.
- **Filesystem scanning (Tier 0)**: Recursive walk with file classification across 25+ tool categories.
- **Godot `.tscn` parser (Tier 1)**: Scene tree extraction, resource references, parent-child relationships.
- **Shader dependency detection**: `#include` directive parsing for GLSL/HLSL/Cg.
- **Source code dependency detection**: Import/dependency parsing for GDScript, C#, Python, JS/TS, Rust.
- **SQLite graph persistence**: Schema with `nodes` and `edges` tables, indexes, CRUD operations.
- **Graph canvas**: ReactFlow-based rendering with pan/zoom, minimap, controls, node selection, and detail panel.
- **B&W minimal UI**: CSS token system with typography and theme variables, dark mode support.
- **Documentation**: README, ARCHITECTURE, ATTRIBUTIONS, CHANGELOG, FIXLIST, AGENTS, vertical-slice-01, graph-schema.
- **GitHub repository**: https://github.com/alvinkgithubschool/Project-Ara.git.
