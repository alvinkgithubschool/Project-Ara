use std::io::BufRead;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

/// Manages the auth server child process — killed on app exit.
pub struct AuthServerProcess {
    child: Mutex<Option<Child>>,
}

impl AuthServerProcess {
    pub fn new() -> Self {
        AuthServerProcess {
            child: Mutex::new(None),
        }
    }
}

impl Drop for AuthServerProcess {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.child.lock() {
            if let Some(ref mut child) = *guard {
                let _ = child.kill();
                let _ = child.wait();
                log::info!("[auth-server] stopped");
            }
        }
    }
}

/// Spawn the Better Auth server and store the process handle.
pub fn start_auth_server(state: &AuthServerProcess) -> Result<u16, String> {
    let server_dir = std::env::current_dir()
        .map_err(|e| format!("Cannot get CWD: {e}"))?
        .join("server");

    if !server_dir.join("index.js").exists() {
        return Err("server/index.js not found — run 'cd server && npm install' first".into());
    }

    let mut child = Command::new("node")
        .arg("index.js")
        .current_dir(&server_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start auth server: {e}"))?;

    let port: u16 = 8787;

    // Pipe stdout to Tauri logs
    if let Some(stdout) = child.stdout.take() {
        let reader = std::io::BufReader::new(stdout);
        std::thread::spawn(move || {
            for line in reader.lines().flatten() {
                log::info!("[auth-server] {line}");
            }
        });
    }

    // Pipe stderr to Tauri logs
    if let Some(stderr) = child.stderr.take() {
        let reader = std::io::BufReader::new(stderr);
        std::thread::spawn(move || {
            for line in reader.lines().flatten() {
                log::warn!("[auth-server] {line}");
            }
        });
    }

    // Store the child handle so it gets killed on Drop
    if let Ok(mut guard) = state.child.lock() {
        *guard = Some(child);
    }

    Ok(port)
}
