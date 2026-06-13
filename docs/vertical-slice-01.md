# Vertical Slice 01 — Auth → Scan → Persist → Canvas

**Date**: 2026-06-13
**Status**: Implemented

## Overview

The first vertical slice of Project Ara implements the complete end-to-end flow:

```
Sign In → Select Project → Scan Filesystem → Parse → Persist → Render Canvas
```

Every layer is functional: a user can authenticate, select a project folder, watch the app scan and classify files, and explore the resulting graph on an interactive canvas.

## What was built

### 1. Auth flow

- **OAuth 2.0** with GitHub and Google providers.
- Local HTTP server approach: starts a listener on a random port, opens the system browser, receives the callback, exchanges the code for tokens.
- State parameter for CSRF protection.
- Tokens persisted via `tauri-plugin-store` to app data directory.
- Session auto-restored on app launch.
- Sign-out clears persisted session.

**Files**: `src-tauri/src/auth/oauth.rs`, `src-tauri/src/auth/session.rs`, `src-tauri/src/commands/auth_cmd.rs`

### 2. Project root selection

- Native folder picker via `tauri-plugin-dialog`.
- `.ara/` directory bootstrap: creates `.ara/graph.db`, `.ara/config.toml`, `.ara/cache/`.
- SQLite schema initialization on first open.

**Files**: `src-tauri/src/commands/project_cmd.rs`

### 3. Filesystem scanning (Tier 0)

- Recursive walk via `walkdir`.
- File classification across 25+ categories by extension and filename.
- Skips `.ara/`, `.git`, and hidden files.
- Produces `GraphNode` (project, folder, file) and `GraphEdge` (CONTAINS) for every file and directory.

**Files**: `src-tauri/src/scanner/walker.rs`, `src-tauri/src/scanner/classifier.rs`

### 4. Tier 1 parsing

Three parsers implemented:

#### Godot `.tscn` parser
- Extracts scene tree: nodes with names, types, and parent relationships.
- Parses `[ext_resource]` and `[sub_resource]` sections.
- Creates `USES` edges from scene to resources.
- Creates parent-child `CONTAINS` edges between scene nodes.

#### Shader dependency parser
- Detects `#include` directives in GLSL, HLSL, and Cg shaders.
- Creates `USES` edges from shader file to included dependency entities.

#### Source code dependency parser
- Language-aware import detection: GDScript (`extends`), C# (`using`), Python (`import`/`from`), JS/TS (`import`/`require`), Rust (`use`/`extern crate`).
- Creates `USES` edges from source file to dependency entities.

**Files**: `src-tauri/src/parser/tscn.rs`, `src-tauri/src/parser/shader.rs`

### 5. Graph persistence

- SQLite schema with two tables: `nodes` and `edges`.
- Indexes on `node_type`, `file_path`, `source_id`, `target_id`.
- Batch insert with `INSERT OR REPLACE`.
- Full graph query returns `GraphSnapshot` (all nodes + all edges).
- Single-node and node-edges queries for detail panel.

**Files**: `src-tauri/src/graph/schema.rs`, `src-tauri/src/graph/ops.rs`, `src-tauri/src/graph/types.rs`

### 6. Canvas rendering

- ReactFlow (`@xyflow/react`) for pan/zoom, minimap, and controls.
- Nodes colored by type: project (black), folder (dark gray), file (medium gray), parsed entity (light gray).
- Edges rendered as smoothstep connections with type labels.
- Node click shows detail panel with type, classification, path, ID, timestamps, and metadata.
- Rescan button in sidebar to re-run the scan pipeline.

**Files**: `src/components/canvas/GraphCanvas.tsx`, `src/components/canvas/NodeDetail.tsx`

### 7. UI system

- Black-and-white minimal design with CSS variable tokens.
- Typography: Inter (sans), JetBrains Mono (mono).
- Dark mode via `prefers-color-scheme` media query.
- Consistent spacing scale, border radii, shadows.

**Files**: `src/styles/fonts.css`, `src/styles/theme.css`, `src/styles/globals.css`

## Files changed/created

### Rust backend (src-tauri/)

```
src/
├── main.rs                    (new)
├── lib.rs                     (new)
├── auth/
│   ├── mod.rs                 (new)
│   ├── oauth.rs               (new)
│   └── session.rs             (new)
├── scanner/
│   ├── mod.rs                 (new)
│   ├── walker.rs              (new)
│   └── classifier.rs          (new)
├── parser/
│   ├── mod.rs                 (new)
│   ├── tscn.rs                (new)
│   └── shader.rs              (new)
├── graph/
│   ├── mod.rs                 (new)
│   ├── types.rs               (new)
│   ├── schema.rs              (new)
│   └── ops.rs                 (new)
├── commands/
│   ├── mod.rs                 (new)
│   ├── auth_cmd.rs            (new)
│   ├── project_cmd.rs         (new)
│   ├── scan_cmd.rs            (new)
│   └── graph_cmd.rs           (new)
└── utils/
    ├── mod.rs                 (new)
    └── error.rs               (new)
```

### Frontend (src/)

```
src/
├── main.tsx                   (new)
├── App.tsx                    (new)
├── core/
│   ├── auth.ts                (new)
│   ├── graph.ts               (new)
│   └── project.ts             (new)
├── hooks/
│   ├── useAuth.ts             (new)
│   ├── useProject.ts          (new)
│   └── useGraph.ts            (new)
├── adapters/
│   ├── tauri/
│   │   └── commands.ts        (new)
│   └── storage/
│       └── auth-store.ts      (new)
├── components/
│   ├── auth/
│   │   ├── AuthGate.tsx       (new)
│   │   ├── SignIn.tsx         (new)
│   │   └── UserMenu.tsx       (new)
│   ├── project/
│   │   └── ProjectSelect.tsx  (new)
│   ├── canvas/
│   │   ├── GraphCanvas.tsx    (new)
│   │   └── NodeDetail.tsx     (new)
│   └── layout/
│       ├── AppShell.tsx       (new)
│       └── Sidebar.tsx        (new)
└── styles/
    ├── fonts.css              (new)
    ├── theme.css              (new)
    └── globals.css            (new)
```

### Documentation

```
README.md                      (new)
ARCHITECTURE.md                (new)
ATTRIBUTIONS.md                (new)
CHANGELOG.md                   (new)
FIXLIST.md                     (new)
AGENTS.md                      (new)
docs/vertical-slice-01.md      (this file)
docs/graph-schema.md           (new)
```

## Testing notes

1. **Auth**: Requires valid OAuth client credentials. Tested with GitHub OAuth App configured with redirect URI `http://127.0.0.1:{port}/callback`.
2. **Scan**: Tested on small projects (~50 files) including Godot project with `.tscn` files and shader files.
3. **Canvas**: Nodes render and are selectable. Pan and zoom work. Minimap reflects graph structure.
4. **Persistence**: Graph survives app restart. Session persists across launches.

## Next steps

1. See [`FIXLIST.md`](../FIXLIST.md) for deferred items.
2. Add incremental scanning with file watchers.
3. Add more Tier 1 parsers (Unity, Unreal, TouchDesigner).
4. Implement graph layout algorithms.
5. Add unit and integration tests.
