/// Local authentication: username/password, TOTP 2FA, passkeys, mock login.
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use totp_rs::{Algorithm, Secret, TOTP};

use crate::auth::db;
use crate::auth::oauth::UserProfile;
use crate::auth::session::Session;
use crate::utils::error::AppError;

// ── Types ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalUser {
    pub id: String,
    pub username: String,
    pub email: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TOTPSetup {
    pub secret: String,
    pub otpauth_url: String,
    pub qr_code_svg: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAuthnChallenge {
    pub challenge: String,
    pub user_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAuthnCredential {
    pub credential_id: String,
    pub public_key: String,
    pub raw_id: String,
    pub response_client_data_json: String,
    pub response_authenticator_data: String,
    pub response_signature: String,
    pub response_user_handle: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAuthnRegistrationResult {
    pub credential_id: String,
    pub public_key: String,
}

// ── Password hashing ─────────────────────────────────────────────────

fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| AppError::Auth(format!("Password hashing failed: {e}")))?;
    Ok(hash.to_string())
}

fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| AppError::Auth(format!("Invalid password hash: {e}")))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

// ── User management ──────────────────────────────────────────────────

pub fn register_user(
    app_data_dir: &PathBuf,
    username: &str,
    email: Option<&str>,
    password: &str,
) -> Result<LocalUser, AppError> {
    let conn = db::open_auth_db(app_data_dir)?;
    let id = uuid::Uuid::new_v4().to_string();
    let hash = hash_password(password)?;
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO local_users (id, username, email, password_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![id, username, email, hash, now],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            AppError::Auth(format!("Username '{username}' already exists"))
        } else {
            AppError::Auth(format!("Registration failed: {e}"))
        }
    })?;

    Ok(LocalUser {
        id,
        username: username.to_string(),
        email: email.map(|s| s.to_string()),
    })
}

pub fn authenticate_user(
    app_data_dir: &PathBuf,
    username: &str,
    password: &str,
) -> Result<LocalUser, AppError> {
    let conn = db::open_auth_db(app_data_dir)?;

    let (id, email, password_hash): (String, Option<String>, String) = conn
        .query_row(
            "SELECT id, email, password_hash FROM local_users WHERE username = ?1",
            rusqlite::params![username],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|_| AppError::Auth("Invalid username or password".into()))?;

    if !verify_password(password, &password_hash)? {
        return Err(AppError::Auth("Invalid username or password".into()));
    }

    Ok(LocalUser {
        id,
        username: username.to_string(),
        email,
    })
}

/// Authenticate and return a full Session (for session persistence).
pub fn sign_in_local(
    app_data_dir: &PathBuf,
    username: &str,
    password: &str,
) -> Result<Session, AppError> {
    let user = authenticate_user(app_data_dir, username, password)?;

    let profile = UserProfile {
        provider: "local".into(),
        provider_id: user.id.clone(),
        email: user.email.clone(),
        name: user.username.clone(),
        avatar_url: None,
    };

    let tokens = crate::auth::oauth::OAuthTokens {
        access_token: String::new(),
        refresh_token: None,
        expires_in: None,
        token_type: "local".into(),
    };

    let session = Session::new(
        crate::auth::oauth::AuthProvider::GitHub, // not used for local
        tokens,
        profile,
    );

    Ok(session)
}

// ── TOTP 2FA ─────────────────────────────────────────────────────────

pub fn generate_totp_secret(username: &str) -> Result<TOTPSetup, AppError> {
    let secret = Secret::generate_secret();
    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret
            .to_bytes()
            .map_err(|e| AppError::Auth(format!("TOTP: {e}")))?,
        Some("Project Ara".into()),
        username.to_string(),
    )
    .map_err(|e| AppError::Auth(format!("TOTP creation: {e}")))?;

    let otpauth_url = totp.get_url();

    Ok(TOTPSetup {
        secret: secret.to_encoded().to_string(),
        otpauth_url,
        qr_code_svg: None, // QR rendering delegated to frontend
    })
}

pub fn enable_totp(
    app_data_dir: &PathBuf,
    user_id: &str,
    secret: &str,
    current_code: &str,
) -> Result<bool, AppError> {
    // Verify the code is valid for this secret before enabling
    let secret_bytes = base32::decode(base32::Alphabet::Rfc4648 { padding: false }, secret)
        .ok_or_else(|| AppError::Auth("Invalid TOTP secret encoding".into()))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
        Some("Project Ara".into()),
        "user".into(),
    )
    .map_err(|e| AppError::Auth(format!("TOTP: {e}")))?;

    if !totp
        .check_current(current_code)
        .map_err(|e| AppError::Auth(format!("TOTP check: {e}")))?
    {
        return Ok(false);
    }

    let conn = db::open_auth_db(app_data_dir)?;
    conn.execute(
        "INSERT OR REPLACE INTO totp_secrets (user_id, secret, enabled) VALUES (?1, ?2, 1)",
        rusqlite::params![user_id, secret],
    )
    .map_err(|e| AppError::Auth(format!("TOTP save: {e}")))?;

    Ok(true)
}

pub fn verify_totp(app_data_dir: &PathBuf, user_id: &str, code: &str) -> Result<bool, AppError> {
    let conn = db::open_auth_db(app_data_dir)?;

    let (secret, enabled): (String, bool) = conn
        .query_row(
            "SELECT secret, enabled FROM totp_secrets WHERE user_id = ?1",
            rusqlite::params![user_id],
            |row| Ok((row.get(0)?, row.get::<_, i32>(1)? != 0)),
        )
        .map_err(|_| AppError::Auth("TOTP not configured".into()))?;

    if !enabled {
        return Ok(true); // No 2FA configured
    }

    let secret_bytes = base32::decode(base32::Alphabet::Rfc4648 { padding: false }, &secret)
        .ok_or_else(|| AppError::Auth("Invalid TOTP secret".into()))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
        Some("Project Ara".into()),
        "user".into(),
    )
    .map_err(|e| AppError::Auth(format!("TOTP: {e}")))?;

    totp.check_current(code)
        .map_err(|e| AppError::Auth(format!("TOTP verify: {e}")))
}

pub fn has_totp_enabled(app_data_dir: &PathBuf, user_id: &str) -> Result<bool, AppError> {
    let conn = db::open_auth_db(app_data_dir)?;
    let result = conn.query_row(
        "SELECT enabled FROM totp_secrets WHERE user_id = ?1",
        rusqlite::params![user_id],
        |row| row.get::<_, i32>(0),
    );
    match result {
        Ok(v) => Ok(v != 0),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(false),
        Err(e) => Err(AppError::Auth(format!("TOTP query: {e}"))),
    }
}

// ── Passkeys / WebAuthn ──────────────────────────────────────────────

/// Generate a WebAuthn challenge for registration or authentication.
pub fn generate_webauthn_challenge(user_id: &str) -> WebAuthnChallenge {
    let mut challenge_bytes = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut challenge_bytes);
    let challenge = base64_url_encode(&challenge_bytes);

    WebAuthnChallenge {
        challenge,
        user_id: user_id.to_string(),
    }
}

fn base64_url_encode(data: &[u8]) -> String {
    use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
    URL_SAFE_NO_PAD.encode(data)
}

/// Store a passkey credential after successful registration.
pub fn store_passkey_credential(
    app_data_dir: &PathBuf,
    user_id: &str,
    credential_id: &str,
    public_key: &str,
) -> Result<(), AppError> {
    let conn = db::open_auth_db(app_data_dir)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO passkey_credentials (id, user_id, credential_id, public_key, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![id, user_id, credential_id, public_key, now],
    )
    .map_err(|e| AppError::Auth(format!("Passkey storage: {e}")))?;

    Ok(())
}

/// Look up a user by passkey credential ID (for authentication).
pub fn find_user_by_credential(
    app_data_dir: &PathBuf,
    credential_id: &str,
) -> Result<Option<LocalUser>, AppError> {
    let conn = db::open_auth_db(app_data_dir)?;

    let result = conn.query_row(
        "SELECT u.id, u.username, u.email
         FROM local_users u
         JOIN passkey_credentials p ON u.id = p.user_id
         WHERE p.credential_id = ?1",
        rusqlite::params![credential_id],
        |row| {
            Ok(LocalUser {
                id: row.get(0)?,
                username: row.get(1)?,
                email: row.get(2)?,
            })
        },
    );

    match result {
        Ok(user) => Ok(Some(user)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(AppError::Auth(format!("Passkey lookup: {e}"))),
    }
}

// ── Mock login (dev/testing) ─────────────────────────────────────────

const MOCK_USER_ID: &str = "mock-user-0000-0000-0000-000000000000";
const MOCK_USERNAME: &str = "dev";
const MOCK_EMAIL: &str = "dev@projectara.local";

pub fn mock_login() -> Result<Session, AppError> {
    let profile = UserProfile {
        provider: "mock".into(),
        provider_id: MOCK_USER_ID.into(),
        email: Some(MOCK_EMAIL.into()),
        name: MOCK_USERNAME.into(),
        avatar_url: None,
    };

    let tokens = crate::auth::oauth::OAuthTokens {
        access_token: String::new(),
        refresh_token: None,
        expires_in: None,
        token_type: "mock".into(),
    };

    Ok(Session::new(
        crate::auth::oauth::AuthProvider::GitHub,
        tokens,
        profile,
    ))
}

pub fn is_development_mode() -> bool {
    // Mock login is always available in debug builds.
    // In release builds, could check a config flag.
    cfg!(debug_assertions)
}
