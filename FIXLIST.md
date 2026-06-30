# FIXLIST

Known issues, deferred work, and planned improvements.

## Deferred to MVP v2

| Item | Priority | Notes |
|------|----------|-------|
| SpacetimeDB sync | Medium | Replace local SQLite with SpacetimeDB for multi-user graph state. Requires self-host infrastructure setup. |
| Git integration | Medium | Expose Git status in UI: dirty files, branch info, commit/push/pull commands. |
| Self-host config | Low | Configuration options for local-only, self-hosted, and hosted SpacetimeDB modes. |

## Deferred to MVP v3

| Item | Priority | Notes |
|------|----------|-------|
| Tier 2 connectors | Medium | API/CLI/MCP-based connectors for Unity, Unreal, TouchDesigner, Notion. |
| Agentic workflows | Low | Cross-tool navigation, documentation agent, refactoring/planning agent. |
| Plugin system | Low | Add when 3+ connector types exist. Avoid premature abstraction. |

## Post-VS01 improvements

| Item | Priority | Notes |
|------|----------|-------|
| Incremental scanning | Medium | Add file watchers and diff-based updates instead of full rescans. |
| Graph layout algorithms | Medium | Replace grid layout with force-directed or hierarchical layout. |
| Font bundling | Low | Bundle Inter and JetBrains Mono font files instead of relying on system fonts. |
| OAuth credential persistence | Medium | Store OAuth client ID/secret in app config instead of requiring re-entry. |
| Error boundary components | Low | Add React error boundaries around canvas and sidebar for graceful failure. |
| Unit tests | High | Add Rust unit tests for parsers, classifier, and graph ops. |
| Frontend tests | High | Add React component tests for AuthGate, ProjectSelect, and GraphCanvas. |
| Performance | Medium | For large projects (>10K files), batch SQLite inserts and add progress reporting. |
| Windows support | Medium | Test on Windows; fix path separator issues in scanner. |

## Post-sprint follow-ups (v0.2.0 demo build)

| Item | Priority | Notes |
|------|----------|-------|
| Persist accepted connections | High | Accept/dismiss/defer in the Connection Report only mutate local UI state. Accepted suggestions should write `edges` into `.ara/graph.db`. |
| Project registry row | Medium | `projects.db` canvas/folder rows use `rootPath` as `project_id`; no row is inserted into `projects` and FK enforcement is off (`PRAGMA foreign_keys` not enabled). Add a `create_project` command and enable FKs. |
| Cluster → sub-canvas wiring | Medium | `ClusterNode.onOpen` and `useCanvas.navigate` exist but cluster hints are not yet materialized into child `canvas_state` rows, so double-click drill-in is not end-to-end. |
| Agent config persistence | Medium | `SettingsPanel` stores the MCP endpoint/enabled flag in `localStorage`, not the `agent_configs` table. Wire to a Tauri command. |
| SpacetimeDB real sync | Medium | App-side module is a stub; `spacetime-module/` is published separately. Pushing graph state through reducers is not implemented. Status indicator reports "wired, not synced". |
| `spacetime-module` build coverage | Low | Not part of `cargo check` (separate WASM toolchain). Confirm the `spacetimedb` crate version and macro API against the installed `spacetime` CLI before publishing. |
| Suggestion dedup across rescans | Low | Each scan re-emits suggestions; they are not deduped against previously accepted/dismissed ones. |
| Desktop runtime verification | Medium | v0.2.0 changes were verified via `cargo check`, `tsc`, and `vite build`; the full Tauri desktop flow (note persistence across restart, drill-in) was not run in a GUI session. |

## Known issues (current)

| Issue | Severity | Notes |
|-------|----------|-------|
| Email may be null for GitHub OAuth | Low | GitHub's `/user` endpoint returns `email: null` if user has no public email. Need to also call `/user/emails`. |
| No progress indicator during scan | Low | Large projects block the UI during scan. Need async progress events from Rust to frontend. |
| Dark mode only via `prefers-color-scheme` | Low | No manual theme toggle yet. CSS uses media query only. |
| ReactFlow nodes reposition on re-render | Low | Nodes re-layout on every re-render. Need to persist positions or use `useNodesState` more carefully. |
