# Project Ara

**Local-first multi-domain creative project control room.**

Project Ara maps game engines, DAWs, creative coding environments, collaboration tools, and cloud storage into a single project graph and interface. See how Unity scenes, Godot nodes, Ableton sessions, shaders, and documents relate — without abandoning your existing tools.

## Status

**Vertical Slice 01** — Auth → Scan → Persist → Canvas (see [`docs/vertical-slice-01.md`](docs/vertical-slice-01.md))

| Feature | Status |
|---------|--------|
| Auth (GitHub + Google OAuth) | ✅ Working |
| Persistent sessions | ✅ Working |
| Project root selection | ✅ Working |
| `.ara/` bootstrap | ✅ Working |
| Filesystem scanning (Tier 0) | ✅ Working |
| Godot `.tscn` parsing (Tier 1) | ✅ Working |
| Shader dependency detection | ✅ Working |
| Source code dependency detection | ✅ Working |
| SQLite graph persistence (`graph.db`) | ✅ Working |
| Canvas rendering (ReactFlow) | ✅ Working |
| SpacetimeDB sync | ⏳ Deferred |
| Tier 2 connectors | ⏳ Deferred |

## Quick Start

### Prerequisites

- **Rust** 1.95+ (with `cargo`)
- **Node.js** 24+
- **pnpm** or **npm**

### Development

```bash
# Install frontend dependencies
npm install

# Run in development mode (Vite + Tauri)
npm run tauri dev
```

### OAuth Credentials

You'll need OAuth client credentials for GitHub and/or Google:

1. **GitHub**: Create an OAuth App at https://github.com/settings/developers
   - Callback URL: `http://127.0.0.1:{random-port}/callback`
2. **Google**: Create an OAuth 2.0 Client ID at https://console.cloud.google.com/apis/credentials
   - Redirect URI: `http://127.0.0.1:{random-port}/callback`

Enter credentials in the app's sign-in screen under "Configure OAuth credentials."

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full architecture overview.

### Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri v2 |
| Frontend | React 19 + TypeScript + Vite |
| Canvas | @xyflow/react (ReactFlow) |
| Local DB | SQLite via `rusqlite` |
| Auth | OAuth 2.0 (GitHub, Google) |
| FS scanning | `walkdir` |

### Project structure

```
src/              # React frontend
  core/           # Domain types (graph, auth, project)
  hooks/          # React hooks (useAuth, useProject, useGraph)
  adapters/       # Tauri command bindings, storage
  components/     # UI components (auth, project, canvas, layout)
  styles/         # CSS tokens (fonts.css, theme.css, globals.css)

src-tauri/        # Rust backend
  src/
    auth/         # OAuth flow, session management
    scanner/      # FS walker, file classifier
    parser/       # Tier 1 parsers (tscn, shader, source)
    graph/        # Types, SQLite schema, CRUD ops
    commands/     # Tauri IPC command handlers
    utils/        # Error types, shared utilities
```

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — Architecture decisions and module boundaries
- [`CHANGELOG.md`](CHANGELOG.md) — Version history
- [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md) — Third-party licenses and credits
- [`FIXLIST.md`](FIXLIST.md) — Known issues and deferred work
- [`AGENTS.md`](AGENTS.md) — Agent guidelines and file ownership
- [`docs/vertical-slice-01.md`](docs/vertical-slice-01.md) — VS01 implementation details
- [`docs/graph-schema.md`](docs/graph-schema.md) — Graph schema reference
