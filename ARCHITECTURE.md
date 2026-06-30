# Architecture — Project Ara

## Guiding principles

1. **Clean Architecture**. Dependencies point inward. Business rules do not depend on frameworks, databases, or delivery mechanisms. The Rust backend follows concentric layers: entities → use cases → adapters → frameworks.
2. **Local-first**. SQLite is the source of truth for project graph state. The app works fully offline.
3. **Modular parsers**. Each file format gets its own parser module. New formats are additive.
4. **Orthogonal layers**. Change the scanner without touching the canvas. Change the auth provider without touching the graph.

## Layer map

```
┌─────────────────────────────────────────────┐
│  Frameworks: Tauri, React, ReactFlow,       │
│  SQLite, reqwest, walkdir                    │
├─────────────────────────────────────────────┤
│  Adapters: Tauri commands, SQLite ops,      │
│  OAuth client, file classifier              │
├─────────────────────────────────────────────┤
│  Use Cases: scan pipeline, auth flow,       │
│  graph queries, project bootstrap           │
├─────────────────────────────────────────────┤
│  Entities: Node, Edge, Project, Session,    │
│  FileClassification                         │
└─────────────────────────────────────────────┘
```

## Rust module map (src-tauri/src/)

| Module | Responsibility | Dependencies (inward) |
|--------|---------------|----------------------|
| `graph/types` | Node, Edge, FileClassification enums | None |
| `graph/schema` | SQLite CREATE TABLE statements | `graph/types` |
| `graph/ops` | CRUD operations on nodes/edges | `graph/types`, `utils/error` |
| `scanner/walker` | Recursive filesystem walk, node/edge creation | `graph/types`, `scanner/classifier` |
| `scanner/classifier` | Extension → FileClassification mapping | `graph/types` |
| `parser/tscn` | Godot .tscn scene tree extraction | `graph/types`, `utils/error` |
| `parser/shader` | Shader include detection, source import detection | `graph/types`, `utils/error` |
| `auth/oauth` | OAuth 2.0 flow (local server, browser, token exchange) | `utils/error` |
| `auth/session` | Session struct, store keys | `auth/oauth` |
| `intelligence/` | Ecosystem adapters, registry, clustering + linking engines | `graph/types` |
| `intelligence/adapters/godot` | Full-tier Godot adapter (name-based clustering) | `intelligence`, `graph/types` |
| `spacetimedb/` | Connection-state stub + `get_spacetimedb_status` (no SDK dep) | None |
| `commands/canvas_cmd` | Canvas state CRUD on `projects.db` | `graph/schema` |
| `commands/*` | Tauri IPC command handlers | All modules above |
| `utils/error` | AppError enum with Display and From impls | None |

> Real SpacetimeDB sync is intentionally out of the app crate. The server module
> is a standalone crate, `spacetime-module/` (compiled to WASM via the
> `spacetime` CLI), so the app build never depends on the SpacetimeDB toolchain.

## Frontend module map (src/)

| Module | Responsibility |
|--------|---------------|
| `core/graph` | TypeScript types mirroring Rust graph types |
| `core/auth` | Auth type definitions |
| `core/project` | Project metadata types |
| `hooks/useAuth` | Auth state management, session restore |
| `hooks/useProject` | Project selection, .ara bootstrap |
| `hooks/useGraph` | Scan, load, node selection |
| `core/ecosystem` | Ecosystem registry + tiers (mirrors Rust adapters) |
| `core/canvas` | Canvas object/state + suggestion/cluster types |
| `hooks/useCanvas` | Root canvas seeding, navigation, note create/persist |
| `hooks/useIntelligence` | Subscribes to scan suggestion/cluster events |
| `adapters/tauri/commands` | Typed wrappers for all Tauri IPC calls |
| `components/auth/*` | SignIn, UserMenu, AuthGate (app shell + integration) |
| `components/project/*` | ProjectSelect |
| `components/canvas/*` | GraphCanvas, NodeDetail, ConnectionReport, BreadcrumbBar, nodes/* (Note/File/Cluster) |
| `components/settings/*` | SettingsPanel (theme, STDB status, agent config) |
| `components/layout/*` | Sidebar |
| `styles/*` | CSS token system (fonts, theme, colors, globals) |

## Data flow

```
User Action → React Component → Hook → Tauri Command Adapter
                                                │
                    ┌───────────────────────────┘
                    ▼
          Tauri IPC (invoke)
                    │
                    ▼
          Rust Command Handler
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Scanner     Parser      Graph Ops
        │           │           │
        └───────────┼───────────┘
                    ▼
              SQLite (graph.db)
```

## Key design decisions

### Two SQLite databases
- **Per-project `.ara/graph.db`** — the scan graph (nodes/edges). Self-contained
  per project: portable, no cross-project contamination, trivial to back up.
- **Global `projects.db`** (app data dir) — app-level state spanning projects:
  the project registry, linked folders, canvas state (notes/media), and agent
  configs. This keeps auth/canvas/app state out of the per-project graph.

### Why OAuth via local HTTP server?
Desktop OAuth needs a redirect URI. A local HTTP server on a random port is the most portable approach. It avoids platform-specific deep link handling and works identically on macOS, Windows, and Linux.

### Why parsers produce graph nodes/edges directly?
Parsers are graph producers. Instead of intermediate representations, they emit `GraphNode` and `GraphEdge` structs directly. This keeps the pipeline simple: walk → parse → insert. Internal representations can be added later when needed for diffing or incremental updates.

### Why ReactFlow?
ReactFlow provides pan/zoom, minimap, controls, and node selection out of the box. It's well-maintained, has a React-native API, and supports custom node rendering when we need it. The abstraction cost is low for the value delivered.

## Deferred architecture

| Item | Reason | Target |
|------|--------|--------|
| SpacetimeDB sync | Requires self-host infrastructure; not blocking local MVP | MVP v2 |
| Tier 2 connectors | Plugin system needs more design; local graph works without it | MVP v3 |
| Incremental scanning | File watchers + diffing adds complexity; full rescan is acceptable for VS01 | Post-VS01 |
| Graph layout algorithms | Current grid layout is adequate; force-directed or hierarchical layout later | Post-VS01 |
| Plugin system | Premature abstraction; add when 3+ connector types exist | MVP v3 |
