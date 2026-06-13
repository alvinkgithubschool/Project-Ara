# AGENTS.md

## Project intent
Project Ara is a local-first multi-domain creative project control room. The current milestone is the first vertical slice: auth, scan, persist, canvas.

## Source-of-truth files
- `Project Ara MVP 2.0 – Multi‑Domain Technical Blueprint.md`
- `Project Ara — Explainer.html`

## Non-negotiables
- Preserve Tauri + React + TypeScript architecture.
- Preserve black/white minimal UI direction and existing typography token system.
- Keep local SQLite as the source of truth for project graph state.
- Treat SpacetimeDB and Tier 2 connectors as deferred unless explicitly requested.
- Keep parsers modular and additive.

## Implementation priorities
1. Working flow over broad feature coverage.
2. Clear module boundaries over clever abstractions.
3. Real documentation over TODO-heavy placeholders.
4. Local-first behavior over cloud dependence.

## File ownership guidance
- Rust handles scanning, parsing orchestration, filesystem access, SQLite, and command APIs.
- React handles auth UI, project flow UI, canvas rendering, and state presentation.
- Shared types should be centralized and versioned carefully.

## Required docs to maintain
- `README.md`
- `ARCHITECTURE.md`
- `ATTRIBUTIONS.md`
- `CHANGELOG.md`
- `FIXLIST.md`
- `docs/vertical-slice-01.md`
- `docs/graph-schema.md`

## Change discipline
- Update docs when behavior changes.
- Record deferred work in `FIXLIST.md`.
- Record user-visible or architecture-visible milestones in `CHANGELOG.md`.
- Prefer small commits and isolated edits.

## Avoid
- premature multi-user collaboration work
- premature plugin systems
- overdesigned animation before the graph works
- mixing auth storage with project graph storage
