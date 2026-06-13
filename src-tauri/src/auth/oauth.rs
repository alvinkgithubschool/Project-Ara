use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::mpsc;
use std::time::Duration;
use url::Url;

use crate::utils::error::AppError;

/// OAuth provider configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthConfig {
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
    pub redirect_uri: String,
    pub scopes: Vec<String>,
}

/// OAuth token response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Option<i64>,
    pub token_type: String,
}

/// User profile info from the OAuth provider.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub provider: String,
    pub provider_id: String,
    pub email: Option<String>,
    pub name: String,
    pub avatar_url: Option<String>,
}

/// Available OAuth providers.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AuthProvider {
    GitHub,
    Google,
}

impl AuthProvider {
    pub fn as_str(&self) -> &'static str {
        match self {
            AuthProvider::GitHub => "github",
            AuthProvider::Google => "google",
        }
    }
}

/// Default OAuth configs — users must override client_id and client_secret.
impl OAuthConfig {
    pub fn github() -> Self {
        OAuthConfig {
            client_id: String::new(),
            client_secret: String::new(),
            auth_url: "https://github.com/login/oauth/authorize".into(),
            token_url: "https://github.com/login/oauth/access_token".into(),
            redirect_uri: String::new(), // filled at runtime
            scopes: vec!["read:user".into(), "user:email".into()],
        }
    }

    pub fn google() -> Self {
        OAuthConfig {
            client_id: String::new(),
            client_secret: String::new(),
            auth_url: "https://accounts.google.com/o/oauth2/v2/auth".into(),
            token_url: "https://oauth2.googleapis.com/token".into(),
            redirect_uri: String::new(),
            scopes: vec![
                "https://www.googleapis.com/auth/userinfo.email".into(),
                "https://www.googleapis.com/auth/userinfo.profile".into(),
            ],
        }
    }
}

/// Build the authorization URL for a given provider.
pub fn build_auth_url(config: &OAuthConfig, state: &str) -> String {
    let mut url = Url::parse(&config.auth_url).expect("Invalid auth URL");
    {
        let mut query = url.query_pairs_mut();
        query.append_pair("client_id", &config.client_id);
        query.append_pair("redirect_uri", &config.redirect_uri);
        query.append_pair("state", state);
        query.append_pair("response_type", "code");
        query.append_pair("scope", &config.scopes.join(" "));
    }
    url.to_string()
}

/// Start a local HTTP server to receive the OAuth callback, then exchange the code for tokens.
pub async fn perform_oauth_flow(
    provider: AuthProvider,
    config: OAuthConfig,
) -> Result<(OAuthTokens, UserProfile), AppError> {
    let listener =
        TcpListener::bind("127.0.0.1:0").map_err(|e| AppError::Auth(format!("Bind: {e}")))?;
    let local_port = listener.local_addr().unwrap().port();
    let redirect_uri = format!("http://127.0.0.1:{local_port}/callback");

    let mut flow_config = config;
    flow_config.redirect_uri = redirect_uri.clone();

    let state = uuid::Uuid::new_v4().to_string();
    let auth_url = build_auth_url(&flow_config, &state);

    open::that(&auth_url).map_err(|e| AppError::Auth(format!("Browser: {e}")))?;

    let (tx, rx) = mpsc::channel::<Result<String, AppError>>();

    std::thread::spawn(move || {
        // Accept one connection with timeout
        listener
            .set_nonblocking(true)
            .expect("set_nonblocking");
        let start = std::time::Instant::now();
        let stream: TcpStream = loop {
            match listener.accept() {
                Ok((s, _)) => break s,
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    if start.elapsed() > Duration::from_secs(120) {
                        let _ = tx.send(Err(AppError::Auth("OAuth timed out".into())));
                        return;
                    }
                    std::thread::sleep(Duration::from_millis(200));
                }
                Err(_) => {
                    let _ = tx.send(Err(AppError::Auth("Listener error".into())));
                    return;
                }
            }
        };

        let mut stream = stream;
        let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
        let mut buf = [0u8; 4096];
        if let Ok(n) = stream.read(&mut buf) {
            let request = String::from_utf8_lossy(&buf[..n]);
            if let Some(line) = request.lines().next() {
                // Parse "GET /callback?code=...&state=... HTTP/1.1"
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    if let Ok(parsed) = Url::parse(&format!("http://localhost{}", parts[1])) {
                        let params: HashMap<String, String> = parsed
                            .query_pairs()
                            .map(|(k, v)| (k.to_string(), v.to_string()))
                            .collect();

                        let returned_state = params.get("state").cloned().unwrap_or_default();
                        if returned_state != state {
                            let _ = tx.send(Err(AppError::Auth(
                                "State mismatch — possible CSRF attack".into(),
                            )));
                            let html = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<html><body><h1>Auth failed: state mismatch</h1></body></html>";
                            let _ = stream.write_all(html.as_bytes());
                            return;
                        }

                        if let Some(code) = params.get("code") {
                            let html = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<html><body><h1>Authenticated!</h1><p>You may close this window.</p></body></html>";
                            let _ = stream.write_all(html.as_bytes());
                            let _ = tx.send(Ok(code.clone()));
                            return;
                        }

                        let error = params
                            .get("error_description")
                            .cloned()
                            .unwrap_or_else(|| "Unknown OAuth error".into());
                        let _ = tx.send(Err(AppError::Auth(error)));
                        let html = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<html><body><h1>Auth failed</h1></body></html>";
                        let _ = stream.write_all(html.as_bytes());
                    }
                }
            }
        }
        let _ = tx.send(Err(AppError::Auth("Failed to read OAuth callback".into())));
    });

    let code = rx
        .recv_timeout(Duration::from_secs(130))
        .map_err(|_| AppError::Auth("OAuth flow timed out".into()))??;

    let tokens = exchange_code_for_tokens(&flow_config, &code).await?;
    let profile = fetch_user_profile(&provider, &tokens).await?;

    Ok((tokens, profile))
}

async fn exchange_code_for_tokens(
    config: &OAuthConfig,
    code: &str,
) -> Result<OAuthTokens, AppError> {
    let client = reqwest::Client::new();
    let mut params = HashMap::new();
    params.insert("client_id", config.client_id.as_str());
    params.insert("client_secret", config.client_secret.as_str());
    params.insert("code", code);
    params.insert("redirect_uri", &config.redirect_uri);
    params.insert("grant_type", "authorization_code");

    let response = client
        .post(&config.token_url)
        .header("Accept", "application/json")
        .form(&params)
        .send()
        .await
        .map_err(|e| AppError::Auth(format!("Token exchange: {e}")))?;

    if !response.status().is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(AppError::Auth(format!("Token exchange failed: {body}")));
    }

    let tokens: OAuthTokens = response
        .json()
        .await
        .map_err(|e| AppError::Auth(format!("Parse token: {e}")))?;

    Ok(tokens)
}

async fn fetch_user_profile(
    provider: &AuthProvider,
    tokens: &OAuthTokens,
) -> Result<UserProfile, AppError> {
    let client = reqwest::Client::new();

    match provider {
        AuthProvider::GitHub => {
            let response = client
                .get("https://api.github.com/user")
                .header("Authorization", format!("token {}", tokens.access_token))
                .header("User-Agent", "Project-Ara")
                .send()
                .await
                .map_err(|e| AppError::Auth(format!("GitHub user: {e}")))?;

            let json: serde_json::Value = response
                .json()
                .await
                .map_err(|e| AppError::Auth(format!("GitHub parse: {e}")))?;

            Ok(UserProfile {
                provider: "github".into(),
                provider_id: json["id"].to_string(),
                email: json["email"].as_str().map(|s| s.to_string()),
                name: json["login"].as_str().unwrap_or("unknown").into(),
                avatar_url: json["avatar_url"].as_str().map(|s| s.to_string()),
            })
        }
        AuthProvider::Google => {
            let response = client
                .get("https://www.googleapis.com/oauth2/v2/userinfo")
                .header("Authorization", format!("Bearer {}", tokens.access_token))
                .send()
                .await
                .map_err(|e| AppError::Auth(format!("Google user: {e}")))?;

            let json: serde_json::Value = response
                .json()
                .await
                .map_err(|e| AppError::Auth(format!("Google parse: {e}")))?;

            Ok(UserProfile {
                provider: "google".into(),
                provider_id: json["id"].to_string(),
                email: json["email"].as_str().map(|s| s.to_string()),
                name: json["name"].as_str().unwrap_or("unknown").into(),
                avatar_url: json["picture"].as_str().map(|s| s.to_string()),
            })
        }
    }
}
