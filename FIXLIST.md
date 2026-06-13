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

## Known issues (current)

| Issue | Severity | Notes |
|-------|----------|-------|
| Email may be null for GitHub OAuth | Low | GitHub's `/user` endpoint returns `email: null` if user has no public email. Need to also call `/user/emails`. |
| No progress indicator during scan | Low | Large projects block the UI during scan. Need async progress events from Rust to frontend. |
| Dark mode only via `prefers-color-scheme` | Low | No manual theme toggle yet. CSS uses media query only. |
| ReactFlow nodes reposition on re-render | Low | Nodes re-layout on every re-render. Need to persist positions or use `useNodesState` more carefully. |
