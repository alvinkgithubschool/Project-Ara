# Changelog

All notable changes to Project Ara.

## [0.1.0] — 2026-06-13

### Added (Vertical Slice 01)

- **Auth**: GitHub and Google OAuth 2.0 sign-in via local HTTP server callback flow.
- **Local auth**: Username/password sign-up and sign-in with argon2 password hashing.
- **2FA (TOTP)**: RFC 6238 time-based one-time password support with setup and verification.
- **Passkey/WebAuthn**: Platform authenticator integration (Touch ID, Windows Hello) for passwordless sign-in.
- **Mock login**: Dev-mode bypass for testing without real credentials.
- **Session persistence**: Sessions stored via tauri-plugin-store and app-level SQLite (ara_auth.db), restored on app launch.
- **Project selection**: Native folder picker via tauri-plugin-dialog.
- **.ara/ bootstrap**: Creates .ara/ with graph.db, config.toml, and cache/ directory.
- **Filesystem scanning (Tier 0)**: Recursive walk with file classification across 25+ tool categories.
- **Godot .tscn parser (Tier 1)**: Scene tree extraction, resource references, parent-child relationships.
- **Shader dependency detection**: include directive parsing for GLSL/HLSL/Cg.
- **Source code dependency detection**: Import/dependency parsing for GDScript, C#, Python, JS/TS, Rust.
- **SQLite graph persistence**: Schema with nodes and edges tables, indexes, CRUD operations.
- **Graph canvas**: ReactFlow-based rendering with pan/zoom, minimap, controls, node selection, and detail panel.
- **B&W minimal UI**: CSS token system with typography and theme variables, dark mode support.
- **Tabbed sign-in**: OAuth, Password, Passkey, Sign Up tabs in the sign-in screen.
- **Documentation**: README, ARCHITECTURE, ATTRIBUTIONS, CHANGELOG, FIXLIST, AGENTS, vertical-slice-01, graph-schema.
- **GitHub repository**: Initialized at https://github.com/alvinkgithubschool/Project-Ara.git.
