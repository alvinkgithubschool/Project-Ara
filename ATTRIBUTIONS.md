# Attributions

Project Ara builds on the following open-source projects and services.

## Runtime dependencies

| Package | License | Usage |
|---------|---------|-------|
| [Tauri](https://tauri.app) | Apache-2.0 / MIT | Desktop application shell |
| [React](https://react.dev) | MIT | UI framework |
| [ReactFlow (@xyflow/react)](https://reactflow.dev) | MIT | Graph canvas rendering |
| [Vite](https://vitejs.dev) | MIT | Frontend bundler |
| [TypeScript](https://www.typescriptlang.org) | Apache-2.0 | Type system |
| [rusqlite](https://github.com/rusqlite/rusqlite) | MIT | SQLite bindings for Rust |
| [SQLite](https://sqlite.org) | Public domain | Embedded database |
| [walkdir](https://github.com/BurntSushi/walkdir) | MIT / Unlicense | Recursive directory walking |
| [reqwest](https://github.com/seanmonstar/reqwest) | MIT / Apache-2.0 | HTTP client for OAuth token exchange |
| [serde](https://serde.rs) | MIT / Apache-2.0 | Serialization framework |
| [uuid](https://github.com/uuid-rs/uuid) | MIT / Apache-2.0 | UUID generation |
| [chrono](https://github.com/chronotope/chrono) | MIT / Apache-2.0 | Date/time handling |
| [open](https://github.com/Byron/open-rs) | MIT | Cross-platform browser opening |
| [url](https://github.com/servo/rust-url) | MIT / Apache-2.0 | URL parsing |

## Tauri plugins

| Plugin | License | Usage |
|--------|---------|-------|
| [tauri-plugin-opener](https://github.com/tauri-apps/plugins-workspace) | MIT / Apache-2.0 | Browser opening via Tauri |
| [tauri-plugin-dialog](https://github.com/tauri-apps/plugins-workspace) | MIT / Apache-2.0 | Native dialog for folder selection |
| [tauri-plugin-store](https://github.com/tauri-apps/plugins-workspace) | MIT / Apache-2.0 | Persistent key-value storage |

## OAuth providers

- GitHub OAuth — https://github.com/login/oauth/authorize
- Google OAuth 2.0 — https://accounts.google.com/o/oauth2/v2/auth

## Design inspiration

- [Clean Architecture](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164) by Robert C. Martin
- [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/) by Andrew Hunt and David Thomas
- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) by Robert C. Martin

## Fonts

The CSS token system references Inter and JetBrains Mono. These are loaded from the system font stack where available; the app does not bundle font files yet.
