use serde::{Deserialize, Serialize};

use super::oauth::{AuthProvider, OAuthTokens, UserProfile};

/// A persisted user session.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub user: UserProfile,
    pub tokens: OAuthTokens,
    pub login_time: String,
    pub provider: String,
}

impl Session {
    pub fn new(provider: AuthProvider, tokens: OAuthTokens, user: UserProfile) -> Self {
        Session {
            user,
            tokens,
            login_time: chrono::Utc::now().to_rfc3339(),
            provider: provider.as_str().to_string(),
        }
    }
}

/// Session store key in the Tauri store plugin.
pub const SESSION_STORE_KEY: &str = "ara_session";

/// Path to the store file relative to app data dir.
pub const SESSION_STORE_FILE: &str = "session.json";
