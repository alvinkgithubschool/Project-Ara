use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;
use tauri_plugin_store::StoreExt;

use crate::auth::local;
use crate::auth::oauth::{self, AuthProvider, OAuthConfig, UserProfile};
use crate::auth::session::Session;

/// In-memory session state — also persisted via Tauri store plugin.
pub struct SessionState {
    pub session: Mutex<Option<Session>>,
}

/// Path to the app data directory, set at startup.
pub struct AppDataState {
    pub app_data_dir: Mutex<PathBuf>,
}

// ── OAuth ────────────────────────────────────────────────────────────

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
    persist_and_set_session(session, state, app_handle)?;
    Ok(profile)
}

// ── Local auth (username/password) ───────────────────────────────────

#[tauri::command]
pub async fn sign_up_local(
    username: String,
    email: Option<String>,
    password: String,
    state: State<'_, SessionState>,
    app_data: State<'_, AppDataState>,
    app_handle: tauri::AppHandle,
) -> Result<UserProfile, String> {
    let dir = app_data.app_data_dir.lock().map_err(|e| e.to_string())?;
    let _user = local::register_user(&dir, &username, email.as_deref(), &password)
        .map_err(|e| e.to_string())?;

    let session = local::sign_in_local(&dir, &username, &password).map_err(|e| e.to_string())?;

    let profile = session.user.clone();
    persist_and_set_session(session, state, app_handle)?;
    Ok(profile)
}

#[tauri::command]
pub async fn sign_in_local(
    username: String,
    password: String,
    totp_code: Option<String>,
    state: State<'_, SessionState>,
    app_data: State<'_, AppDataState>,
    app_handle: tauri::AppHandle,
) -> Result<UserProfile, String> {
    let dir = app_data.app_data_dir.lock().map_err(|e| e.to_string())?;

    // First authenticate password
    let user = local::authenticate_user(&dir, &username, &password).map_err(|e| e.to_string())?;

    // Check TOTP if configured
    if local::has_totp_enabled(&dir, &user.id).unwrap_or(false) {
        match totp_code {
            Some(ref code) => {
                if !local::verify_totp(&dir, &user.id, code).map_err(|e| e.to_string())? {
                    return Err("Invalid 2FA code".into());
                }
            }
            None => {
                return Err("2FA_REQUIRED".into());
            }
        }
    }

    let session = local::sign_in_local(&dir, &username, &password).map_err(|e| e.to_string())?;

    let profile = session.user.clone();
    persist_and_set_session(session, state, app_handle)?;
    Ok(profile)
}

// ── 2FA / TOTP ──────────────────────────────────────────────────────

#[tauri::command]
pub async fn setup_totp(state: State<'_, SessionState>) -> Result<local::TOTPSetup, String> {
    let session = state.session.lock().map_err(|e| e.to_string())?;
    let username = session
        .as_ref()
        .map(|s| s.user.name.clone())
        .unwrap_or_else(|| "user".into());

    local::generate_totp_secret(&username).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn enable_totp(
    secret: String,
    code: String,
    state: State<'_, SessionState>,
    app_data: State<'_, AppDataState>,
) -> Result<bool, String> {
    let dir = app_data.app_data_dir.lock().map_err(|e| e.to_string())?;
    let session = state.session.lock().map_err(|e| e.to_string())?;
    let user_id = session
        .as_ref()
        .map(|s| s.user.provider_id.clone())
        .unwrap_or_default();

    local::enable_totp(&dir, &user_id, &secret, &code).map_err(|e| e.to_string())
}

// ── Passkeys ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn webauthn_register_challenge(
    state: State<'_, SessionState>,
) -> Result<local::WebAuthnChallenge, String> {
    let session = state.session.lock().map_err(|e| e.to_string())?;
    let user_id = session
        .as_ref()
        .map(|s| s.user.provider_id.clone())
        .unwrap_or_default();

    Ok(local::generate_webauthn_challenge(&user_id))
}

#[tauri::command]
pub async fn webauthn_register_verify(
    credential_id: String,
    public_key: String,
    state: State<'_, SessionState>,
    app_data: State<'_, AppDataState>,
) -> Result<(), String> {
    let dir = app_data.app_data_dir.lock().map_err(|e| e.to_string())?;
    let session = state.session.lock().map_err(|e| e.to_string())?;
    let user_id = session
        .as_ref()
        .map(|s| s.user.provider_id.clone())
        .unwrap_or_default();

    local::store_passkey_credential(&dir, &user_id, &credential_id, &public_key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn webauthn_auth_challenge(
    _app_data: State<'_, AppDataState>,
) -> Result<local::WebAuthnChallenge, String> {
    Ok(local::generate_webauthn_challenge(""))
}

#[tauri::command]
pub async fn webauthn_auth_verify(
    credential_id: String,
    state: State<'_, SessionState>,
    app_data: State<'_, AppDataState>,
    app_handle: tauri::AppHandle,
) -> Result<UserProfile, String> {
    let dir = app_data.app_data_dir.lock().map_err(|e| e.to_string())?;

    let local_user = local::find_user_by_credential(&dir, &credential_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Passkey not recognized".to_string())?;

    let profile = UserProfile {
        provider: "passkey".into(),
        provider_id: local_user.id.clone(),
        email: local_user.email.clone(),
        name: local_user.username.clone(),
        avatar_url: None,
    };

    let tokens = crate::auth::oauth::OAuthTokens {
        access_token: String::new(),
        refresh_token: None,
        expires_in: None,
        token_type: "passkey".into(),
    };

    let session = Session::new(AuthProvider::GitHub, tokens, profile.clone());
    persist_and_set_session(session, state, app_handle)?;
    Ok(profile)
}

// ── Mock login ──────────────────────────────────────────────────────

#[tauri::command]
pub async fn mock_login(
    state: State<'_, SessionState>,
    app_handle: tauri::AppHandle,
) -> Result<UserProfile, String> {
    if !local::is_development_mode() {
        return Err("Mock login is only available in development mode".into());
    }

    let session = local::mock_login().map_err(|e| e.to_string())?;
    let profile = session.user.clone();
    persist_and_set_session(session, state, app_handle)?;
    Ok(profile)
}

// ── Session management ──────────────────────────────────────────────

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

#[tauri::command]
pub async fn get_session(state: State<'_, SessionState>) -> Result<Option<UserProfile>, String> {
    if let Ok(current) = state.session.lock() {
        Ok(current.as_ref().map(|s| s.user.clone()))
    } else {
        Ok(None)
    }
}

// ── Helpers ─────────────────────────────────────────────────────────

fn persist_and_set_session(
    session: Session,
    state: State<'_, SessionState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    if let Ok(store) = app_handle.store(crate::auth::session::SESSION_STORE_FILE) {
        let _ = store.set(
            crate::auth::session::SESSION_STORE_KEY,
            serde_json::to_value(&session).unwrap_or_default(),
        );
        let _ = store.save();
    }
    if let Ok(mut current) = state.session.lock() {
        *current = Some(session);
    }
    Ok(())
}
