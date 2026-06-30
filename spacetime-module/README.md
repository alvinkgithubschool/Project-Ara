# Project Ara — SpacetimeDB Module

A standalone SpacetimeDB server module for real-time graph state. **Not part of
the Tauri app build** — it is compiled to WASM and published with the
`spacetime` CLI.

## Prerequisites

```bash
# Install SpacetimeDB (macOS)
curl -sSf https://spacetimedb.com/install | sh
spacetime version          # note the version, pin it in Cargo.toml
spacetime start            # local instance on localhost:3000
```

## Publish

```bash
cd spacetime-module
spacetime publish -s local project-ara
```

## Status

Per `AGENTS.md`, SpacetimeDB is **wired, not synced**: local SQLite remains the
source of truth. The Tauri app reports connection status via the
`get_spacetimedb_status` command (see `src-tauri/src/spacetimedb/`) but does not
push graph state here yet. Enabling real sync is tracked in `FIXLIST.md`.
