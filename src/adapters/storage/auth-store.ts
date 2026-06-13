/**
 * Persistent auth token storage.
 * Session is persisted by the Rust backend via tauri-plugin-store,
 * so this module is a thin convenience layer for the frontend.
 */

export const AUTH_STORE_PATH = 'session.json';
