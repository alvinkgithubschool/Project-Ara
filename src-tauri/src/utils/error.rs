use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Auth(String),
    Scan(String),
    Graph(String),
    Parse(String),
    Io(std::io::Error),
    Sql(rusqlite::Error),
    Serde(serde_json::Error),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Auth(msg) => write!(f, "Auth error: {msg}"),
            AppError::Scan(msg) => write!(f, "Scan error: {msg}"),
            AppError::Graph(msg) => write!(f, "Graph error: {msg}"),
            AppError::Parse(msg) => write!(f, "Parse error: {msg}"),
            AppError::Io(e) => write!(f, "IO error: {e}"),
            AppError::Sql(e) => write!(f, "SQL error: {e}"),
            AppError::Serde(e) => write!(f, "Serialization error: {e}"),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e)
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::Sql(e)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Serde(e)
    }
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
