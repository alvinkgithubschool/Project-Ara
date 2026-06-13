# Changelog

All notable changes to Project Ara.

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
