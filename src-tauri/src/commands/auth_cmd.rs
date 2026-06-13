use tauri::State;
use std::sync::Mutex;
use tauri_plugin_store::StoreExt;

use crate::auth::oauth::{self, AuthProvider, OAuthConfig, UserProfile};
use crate::auth::session::Session;

/// In-memory session state — also persisted via Tauri store plugin.
pub struct SessionState {
    pub session: Mutex<Option<Session>>,
}

/// Sign in with a provider. Opens the browser for OAuth flow and persists the session.
#[tauri::command]
pub async fn sign_in(
    provider: String,
    client_id: String,
    client_secret: String,
    state: State<'_, SessionState>,
    app_handle: tauri::AppHandle,
) -> Result<UserProfile, String> {
    let provider = match provider.as_str() {
        "github" => AuthProvider::GitHub,
        "google" => AuthProvider::Google,
        _ => return Err(format!("Unknown provider: {provider}")),
    };

    let config = match provider {
        AuthProvider::GitHub => {
            let mut c = OAuthConfig::github();
            c.client_id = client_id;
            c.client_secret = client_secret;
            c
        }
        AuthProvider::Google => {
            let mut c = OAuthConfig::google();
            c.client_id = client_id;
            c.client_secret = client_secret;
            c
        }
    };

    let (tokens, profile) = oauth::perform_oauth_flow(provider.clone(), config)
        .await
        .map_err(|e| e.to_string())?;

    let session = Session::new(provider, tokens, profile.clone());

    // Persist session via Tauri store
    if let Ok(store) = app_handle.store(crate::auth::session::SESSION_STORE_FILE) {
        let _ = store.set(
            crate::auth::session::SESSION_STORE_KEY,
            serde_json::to_value(&session).unwrap_or_default(),
        );
        let _ = store.save();
    }

    // Update in-memory state
    if let Ok(mut current) = state.session.lock() {
        *current = Some(session);
    }

    Ok(profile)
}

/// Restore a persisted session on app startup.
#[tauri::command]
pub async fn restore_session(
    state: State<'_, SessionState>,
    app_handle: tauri::AppHandle,
) -> Result<Option<UserProfile>, String> {
    if let Ok(store) = app_handle.store(crate::auth::session::SESSION_STORE_FILE) {
        if let Some(value) = store.get(crate::auth::session::SESSION_STORE_KEY) {
            if let Ok(session) = serde_json::from_value::<Session>(value.clone()) {
                let profile = session.user.clone();
                if let Ok(mut current) = state.session.lock() {
                    *current = Some(session);
                }
                return Ok(Some(profile));
            }
        }
    }
    Ok(None)
}

/// Sign out — clears session from memory and persisted store.
#[tauri::command]
pub async fn sign_out(
    state: State<'_, SessionState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    if let Ok(mut current) = state.session.lock() {
        *current = None;
    }
    if let Ok(store) = app_handle.store(crate::auth::session::SESSION_STORE_FILE) {
        let _ = store.delete(crate::auth::session::SESSION_STORE_KEY);
        let _ = store.save();
    }
    Ok(())
}

/// Check if a session exists.
#[tauri::command]
pub async fn get_session(
    state: State<'_, SessionState>,
) -> Result<Option<UserProfile>, String> {
    if let Ok(current) = state.session.lock() {
        Ok(current.as_ref().map(|s| s.user.clone()))
    } else {
        Ok(None)
    }
}
