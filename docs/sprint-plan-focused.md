# Project Ara — Focused Sprint Plan (3-5 Days)

**Date**: 2026-06-29
**Status**: Ready to execute
**Engineers**: 1-2
**Goal**: Demo-ready build with SpacetimeDB wiring, Render-deployed auth, ecosystem-aware scanning with toggles, and markdown canvas notes.

---

## SPRINT OVERVIEW

Four workstreams running in parallel across 3-5 days. Each day has concrete deliverables. The goal is a **demo-ready** build that shows:

1. SpacetimeDB-connected canvas (wired, not fully synced)
2. Render-deployable auth server with PostgreSQL support
3. Ecosystem-aware scanning with tier toggles (Full / Partial / Reference)
4. Markdown notes with edit/preview modes + formatting toolbar
5. Visual differentiation by ecosystem, folder source, confidence, and tier
6. Connection report panel with accept/dismiss/defer
7. Sub-canvas navigation basics

---

## DAY 0 — PRE-SPRINT SETUP (Complete before sprint starts)

### SP-0.1: Install SpacetimeDB locally

```bash
# macOS
curl -sSf https://spacetimedb.com/install | sh
# Or: brew install clockworklabs/tap/spacetime

# Verify
spacetime version

# Start local SpacetimeDB
spacetime start
```

**Deliverable**: SpacetimeDB running on `localhost:3000`

### SP-0.2: Create Render account & project

Create a Render account at https://render.com. Create a new "Web Service" project. We'll deploy the auth server to it on Day 1.

### SP-0.3: Install new frontend dependency

```bash
npm install react-markdown
```

---

## DAY 1 — SPACETIMEDB + AUTH DEPLOYMENT + FOUNDATION

### TASK 1.1: Add SpacetimeDB Rust Client SDK

**File**: `src-tauri/Cargo.toml` (MODIFY)

Add to `[dependencies]`:
```toml
spacetimedb-sdk = "1.0"
```

**File**: `src-tauri/src/spacetimedb/mod.rs` (NEW)

```rust
use spacetimedb_sdk::{identity::Identity, DbContext};

/// Manages the SpacetimeDB connection for real-time graph state.
/// Deferred for full MVP v2, but wired for demo purposes.
pub mod schema;
pub mod reducer;

pub struct SpacetimeConnection {
    pub connected: bool,
    pub identity: Option<Identity>,
}

impl SpacetimeConnection {
    pub fn new() -> Self {
        SpacetimeConnection {
            connected: false,
            identity: None,
        }
    }

    /// Connect to a SpacetimeDB instance (local or remote).
    pub fn connect(&mut self, uri: &str, module_name: &str) -> Result<(), String> {
        log::info!("SpacetimeDB connection configured: {} / {}", uri, module_name);
        self.connected = true;
        Ok(())
    }
}
```

**File**: `src-tauri/src/spacetimedb/schema.rs` (NEW)

Define SpacetimeDB-compatible table definitions. These mirror our SQLite schema but use SpacetimeDB's type system:

```rust
use spacetimedb_sdk::SpacetimeType;

#[derive(SpacetimeType, Clone)]
pub struct StdbNode {
    pub id: String,
    pub node_type: String,
    pub label: String,
    pub file_path: Option<String>,
    pub classification: Option<String>,
    pub metadata: String,       // JSON string
    pub project_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(SpacetimeType, Clone)]
pub struct StdbEdge {
    pub id: String,
    pub edge_type: String,
    pub source_id: String,
    pub target_id: String,
    pub label: Option<String>,
    pub metadata: String,
    pub confidence: f64,
    pub project_id: String,
}

#[derive(SpacetimeType, Clone)]
pub struct StdbCanvasObject {
    pub id: String,
    pub canvas_id: String,
    pub project_id: String,
    pub object_type: String,
    pub position_x: f32,
    pub position_y: f32,
    pub data: String,           // JSON
}
```

**File**: `src-tauri/src/spacetimedb/reducer.rs` (NEW)

Define reducers (mutations) that SpacetimeDB modules can process:

```rust
/// Reducer stubs — these map to SpacetimeDB server-side reducer functions.
pub mod reducers {
    pub const INSERT_NODES: &str = "insert_nodes";
    pub const INSERT_EDGES: &str = "insert_edges";
    pub const UPSERT_CANVAS_OBJECT: &str = "upsert_canvas_object";
    pub const ACCEPT_SUGGESTION: &str = "accept_suggestion";
}
```

**Register in `src-tauri/src/lib.rs`**:
```rust
mod spacetimedb;
```

**Deliverable**: SpacetimeDB module compiles. Connection stub exists. Schema types defined.

---

### TASK 1.2: Render-Ready Auth Server

**Problem**: Better Auth's `better-sqlite3` stores to a local file. On Render, the filesystem is ephemeral. Need PostgreSQL.

**Solution**: Switch auth server to use `pg` (PostgreSQL) driver for production, keep SQLite for local dev.

**File**: `server/auth.js` (MODIFY)

```js
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Database: SQLite for local dev, PostgreSQL for production ──
const isProduction = process.env.NODE_ENV === "production";
let database;

if (isProduction && process.env.DATABASE_URL) {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  database = pool;
} else {
  const dataDir = process.env.ARA_DATA_DIR || path.resolve(__dirname, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "ara_auth.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  database = db;
}

export const auth = betterAuth({
  database,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  trustedOrigins: [
    process.env.CORS_ORIGIN || "http://localhost:1420",
    "http://localhost:8787",
    "tauri://localhost",
  ],
});
```

**File**: `server/package.json` (MODIFY — add pg dependency)

```json
{
  "dependencies": {
    "pg": "^8.13.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

Run:
```bash
cd server && npm install pg
```

**File**: `server/render.yaml` (NEW)

```yaml
services:
  - type: web
    name: project-ara-auth
    env: node
    region: oregon
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && node index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: ara-auth-db
          property: connectionString
      - key: GITHUB_CLIENT_ID
        sync: false
      - key: GITHUB_CLIENT_SECRET
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: AUTH_PORT
        value: "8787"
      - key: CORS_ORIGIN
        value: "tauri://localhost"

databases:
  - name: ara-auth-db
    plan: free
    postgresMajorVersion: 16
```

**File**: `server/Dockerfile` (NEW — alternative to render.yaml)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production
COPY server/ ./
EXPOSE 8787
CMD ["node", "index.js"]
```

**Deliverable**: Auth server works locally with SQLite, deploys to Render with PostgreSQL.

---

### TASK 1.3: Projects Database Schema + Canvas State Tables

**File**: `src-tauri/src/graph/schema.rs` (EXTEND — add new function)

```rust
/// Initialize the global projects database at ~/.ara/projects.db
pub fn initialize_projects_db(app_data_dir: &std::path::Path) -> Result<rusqlite::Connection, rusqlite::Error> {
    let db_path = app_data_dir.join("projects.db");
    let conn = rusqlite::Connection::open(&db_path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS linked_folders (
            id TEXT PRIMARY KEY NOT NULL,
            project_id TEXT NOT NULL,
            path TEXT NOT NULL,
            label TEXT NOT NULL,
            ecosystem TEXT,
            tier TEXT NOT NULL DEFAULT 'auto',
            color_tag TEXT NOT NULL DEFAULT '#00d4ff',
            added_at TEXT NOT NULL,
            last_scanned_at TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS canvas_state (
            id TEXT PRIMARY KEY NOT NULL,
            project_id TEXT NOT NULL,
            parent_canvas_id TEXT,
            label TEXT NOT NULL,
            viewport_x REAL NOT NULL DEFAULT 0,
            viewport_y REAL NOT NULL DEFAULT 0,
            viewport_zoom REAL NOT NULL DEFAULT 1.0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS canvas_objects (
            id TEXT PRIMARY KEY NOT NULL,
            canvas_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            object_type TEXT NOT NULL,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            width REAL,
            height REAL,
            z_index INTEGER NOT NULL DEFAULT 0,
            data TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (canvas_id) REFERENCES canvas_state(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS agent_configs (
            id TEXT PRIMARY KEY NOT NULL,
            project_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            endpoint_url TEXT,
            model_name TEXT,
            api_key_ref TEXT,
            permissions TEXT NOT NULL DEFAULT '{}',
            enabled INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        ",
    )?;

    Ok(conn)
}
```

**File**: `src-tauri/src/lib.rs` (MODIFY — add to setup closure)

```rust
// Initialize global projects database
if let Ok(app_data_dir) = app.path().app_data_dir() {
    if let Err(e) = crate::graph::schema::initialize_projects_db(&app_data_dir) {
        log::error!("Failed to initialize projects.db: {e}");
    }
}
```

**Deliverable**: `projects.db` created with all 5 tables.

---

### TASK 1.4: `canvas_cmd.rs` — Canvas State CRUD Commands

**File**: `src-tauri/src/commands/canvas_cmd.rs` (NEW)

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CanvasObjectData {
    pub id: String,
    pub canvas_id: String,
    pub project_id: String,
    pub object_type: String,
    pub position_x: f32,
    pub position_y: f32,
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub z_index: i32,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CanvasStateData {
    pub id: String,
    pub project_id: String,
    pub parent_canvas_id: Option<String>,
    pub label: String,
    pub viewport_x: f32,
    pub viewport_y: f32,
    pub viewport_zoom: f32,
    pub objects: Vec<CanvasObjectData>,
}

/// Save or update a canvas object (note, media, operator, etc.)
#[tauri::command]
pub async fn upsert_canvas_object(
    app_handle: tauri::AppHandle,
    obj: CanvasObjectData,
) -> Result<(), String> {
    let state = app_handle.state::<crate::AppDataState>();
    let app_data_dir = state.app_data_dir.lock().map_err(|e| e.to_string())?.clone();
    let db_path = app_data_dir.join("projects.db");
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR REPLACE INTO canvas_objects
         (id, canvas_id, project_id, object_type, position_x, position_y, width, height, z_index, data, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                 COALESCE((SELECT created_at FROM canvas_objects WHERE id = ?1), ?11),
                 ?11)",
        rusqlite::params![
            obj.id, obj.canvas_id, obj.project_id, obj.object_type,
            obj.position_x, obj.position_y, obj.width, obj.height, obj.z_index,
            serde_json::to_string(&obj.data).unwrap_or_default(),
            now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

/// Load canvas state including all objects for a given canvas.
#[tauri::command]
pub async fn load_canvas_state(
    app_handle: tauri::AppHandle,
    project_id: String,
    canvas_id: String,
) -> Result<CanvasStateData, String> {
    let state = app_handle.state::<crate::AppDataState>();
    let app_data_dir = state.app_data_dir.lock().map_err(|e| e.to_string())?.clone();
    let db_path = app_data_dir.join("projects.db");
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let canvas: CanvasStateData = conn.query_row(
        "SELECT id, project_id, parent_canvas_id, label, viewport_x, viewport_y, viewport_zoom
         FROM canvas_state WHERE id = ?1",
        [&canvas_id],
        |row| {
            Ok(CanvasStateData {
                id: row.get(0)?,
                project_id: row.get(1)?,
                parent_canvas_id: row.get(2)?,
                label: row.get(3)?,
                viewport_x: row.get(4)?,
                viewport_y: row.get(5)?,
                viewport_zoom: row.get(6)?,
                objects: vec![],
            })
        },
    ).map_err(|e| format!("Canvas not found: {e}"))?;

    let mut stmt = conn.prepare(
        "SELECT id, canvas_id, project_id, object_type, position_x, position_y,
                width, height, z_index, data
         FROM canvas_objects WHERE canvas_id = ?1 ORDER BY z_index"
    ).map_err(|e| e.to_string())?;

    let objects: Vec<CanvasObjectData> = stmt.query_map([&canvas_id], |row| {
        let data_str: String = row.get(9)?;
        Ok(CanvasObjectData {
            id: row.get(0)?,
            canvas_id: row.get(1)?,
            project_id: row.get(2)?,
            object_type: row.get(3)?,
            position_x: row.get(4)?,
            position_y: row.get(5)?,
            width: row.get(6)?,
            height: row.get(7)?,
            z_index: row.get(8)?,
            data: serde_json::from_str(&data_str).unwrap_or_default(),
        })
    })?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(CanvasStateData { objects, ..canvas })
}

/// Delete a canvas object.
#[tauri::command]
pub async fn delete_canvas_object(
    app_handle: tauri::AppHandle,
    object_id: String,
) -> Result<(), String> {
    let state = app_handle.state::<crate::AppDataState>();
    let app_data_dir = state.app_data_dir.lock().map_err(|e| e.to_string())?.clone();
    let db_path = app_data_dir.join("projects.db");
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM canvas_objects WHERE id = ?1", [&object_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Save viewport state.
#[tauri::command]
pub async fn save_viewport(
    app_handle: tauri::AppHandle,
    canvas_id: String,
    x: f32,
    y: f32,
    zoom: f32,
) -> Result<(), String> {
    let state = app_handle.state::<crate::AppDataState>();
    let app_data_dir = state.app_data_dir.lock().map_err(|e| e.to_string())?.clone();
    let db_path = app_data_dir.join("projects.db");
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE canvas_state SET viewport_x = ?1, viewport_y = ?2, viewport_zoom = ?3,
         updated_at = ?4 WHERE id = ?5",
        rusqlite::params![x, y, zoom, chrono::Utc::now().to_rfc3339(), canvas_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
```

**Register in `src-tauri/src/commands/mod.rs`**:
```rust
pub mod canvas_cmd;
```

**Register in `src-tauri/src/lib.rs` invoke_handler**:
```rust
commands::canvas_cmd::upsert_canvas_object,
commands::canvas_cmd::load_canvas_state,
commands::canvas_cmd::delete_canvas_object,
commands::canvas_cmd::save_viewport,
```

**Deliverable**: All canvas CRUD commands working via Tauri IPC.

---

## DAY 2 — ECOSYSTEM ADAPTERS + TOGGLE SYSTEM + MARKDOWN NOTES

### TASK 2.1: Ecosystem Adapter Trait + Registry

**File**: `src-tauri/src/intelligence/mod.rs` (NEW)

```rust
pub mod adapters;
pub mod clustering;
pub mod linking;

use std::path::Path;
use serde::{Deserialize, Serialize};

/// Ecosystem support tier.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum EcosystemTier {
    /// Full Tier 0 + Tier 1 support (classification + deep parsing + clustering)
    Full,
    /// Tier 0 only (classification + file graph, no deep parsing)
    Partial,
    /// Reference only (files flagged for agent awareness, no parsing)
    Reference,
}

/// Metadata about a supported ecosystem.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EcosystemInfo {
    pub id: String,
    pub name: String,
    pub tier: EcosystemTier,
    pub description: String,
    pub project_markers: Vec<String>,
    pub extensions: Vec<String>,
}

/// Trait for ecosystem-specific intelligence adapters.
pub trait EcosystemAdapter: Send + Sync {
    fn ecosystem_info(&self) -> EcosystemInfo;

    /// Detect if a given path is a project root for this ecosystem.
    fn detect_project(&self, path: &Path) -> bool;

    /// Suggest clusters from a set of file nodes in this ecosystem.
    fn suggest_clusters(
        &self,
        _nodes: &[crate::graph::types::GraphNode],
    ) -> Vec<ClusteringHint> {
        vec![]
    }

    /// Extract additional metadata from a file in this ecosystem.
    fn extract_metadata(&self, _path: &Path) -> Option<serde_json::Value> {
        None
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusteringHint {
    pub suggested_label: String,
    pub member_node_ids: Vec<String>,
    pub confidence: f64,
    pub reason: String,
}

/// Registry of all ecosystem adapters.
pub struct AdapterRegistry {
    adapters: Vec<Box<dyn EcosystemAdapter>>,
}

impl AdapterRegistry {
    pub fn new() -> Self {
        AdapterRegistry { adapters: vec![] }
    }

    pub fn register(&mut self, adapter: Box<dyn EcosystemAdapter>) {
        self.adapters.push(adapter);
    }

    pub fn get_all(&self) -> Vec<&dyn EcosystemAdapter> {
        self.adapters.iter().map(|a| a.as_ref()).collect()
    }

    pub fn detect_ecosystem(&self, path: &Path) -> Option<String> {
        self.adapters.iter().find(|a| a.detect_project(path))
            .map(|a| a.ecosystem_info().id.clone())
    }

    /// Get ecosystem info for all registered adapters (for UI toggle system).
    pub fn list_ecosystems(&self) -> Vec<EcosystemInfo> {
        self.adapters.iter().map(|a| a.ecosystem_info()).collect()
    }
}
```

**Deliverable**: Trait system compiles. Registry pattern ready for adapters.

---

### TASK 2.2: Godot Ecosystem Adapter (Full Tier)

**File**: `src-tauri/src/intelligence/adapters/godot.rs` (NEW)

```rust
use std::path::Path;
use std::collections::HashMap;
use crate::intelligence::{EcosystemAdapter, EcosystemInfo, EcosystemTier, ClusteringHint};
use crate::graph::types::GraphNode;

pub struct GodotAdapter;

impl EcosystemAdapter for GodotAdapter {
    fn ecosystem_info(&self) -> EcosystemInfo {
        EcosystemInfo {
            id: "godot".into(),
            name: "Godot Engine".into(),
            tier: EcosystemTier::Full,
            description: "Full support: scene parsing, script dependency graphs, resource linking, cluster detection".into(),
            project_markers: vec!["project.godot".into()],
            extensions: vec![
                "tscn".into(), "tres".into(), "gd".into(),
                "godot".into(), "gdshader".into(),
            ],
        }
    }

    fn detect_project(&self, path: &Path) -> bool {
        path.join("project.godot").exists()
    }

    fn suggest_clusters(&self, nodes: &[GraphNode]) -> Vec<ClusteringHint> {
        let mut hints = Vec::new();
        let mut name_groups: HashMap<String, Vec<String>> = HashMap::new();

        for node in nodes {
            if node.node_type == crate::graph::types::NodeType::File {
                if let Some(ref path_str) = node.file_path {
                    if let Some(stem) = Path::new(path_str).file_stem().and_then(|s| s.to_str()) {
                        name_groups.entry(stem.to_string())
                            .or_default()
                            .push(node.id.clone());
                    }
                }
            }
        }

        for (stem, ids) in name_groups {
            if ids.len() >= 2 {
                hints.push(ClusteringHint {
                    suggested_label: stem,
                    member_node_ids: ids,
                    confidence: 0.8,
                    reason: format!("Same base name '{}' with different Godot extensions", stem),
                });
            }
        }

        hints
    }
}
```

**File**: `src-tauri/src/intelligence/adapters/mod.rs` (NEW)

```rust
pub mod godot;

use super::AdapterRegistry;

/// Register all available ecosystem adapters.
pub fn register_all(registry: &mut AdapterRegistry) {
    registry.register(Box::new(godot::GodotAdapter));
    // Future:
    // registry.register(Box::new(blender::BlenderAdapter));
    // registry.register(Box::new(unity::UnityAdapter));
    // registry.register(Box::new(cables::CablesGlAdapter));
    // registry.register(Box::new(touchdesigner::TouchDesignerAdapter));
    // registry.register(Box::new(ableton::AbletonAdapter));
}
```

**Deliverable**: Godot adapter with Tier Full support. Name-based cluster detection.

---

### TASK 2.3: Ecosystem Support Plan — Timeline & Toggles

**Ecosystem Support Matrix:**

| Ecosystem | Current Tier | Goal Tier | Adapter Status | Timeline |
|-----------|-------------|-----------|----------------|----------|
| **Godot** | Tier Full | Tier Full | ✅ Built (Day 2) | Done |
| **Cables.gl** | Tier Partial | Tier Partial | 🔲 Pending | Day 3-4 |
| **Blender** | Tier Partial | Tier Full (later) | 🔲 Pending | Day 3 |
| **Unity** | Tier Partial | Tier Full (later) | 🔲 Pending | Day 4 |
| **TouchDesigner** | Tier Partial | Tier Full (later) | 🔲 Pending | Day 4 |
| **Ableton Live** | Tier Reference | Tier Partial (later) | 🔲 Pending | Day 5 |

**Toggle System — Frontend**:

**File**: `src/core/ecosystem.ts` (NEW)

```typescript
export type EcosystemTier = 'full' | 'partial' | 'reference';

export interface EcosystemInfo {
  id: string;
  name: string;
  tier: EcosystemTier;
  description: string;
  projectMarkers: string[];
  extensions: string[];
}

// Ecosystem registry — mirrors Rust AdapterRegistry
export const ECOSYSTEMS: EcosystemInfo[] = [
  {
    id: 'godot',
    name: 'Godot Engine',
    tier: 'full',
    description: 'Scene parsing, script deps, resource linking, auto-clustering',
    projectMarkers: ['project.godot'],
    extensions: ['tscn', 'tres', 'gd', 'godot', 'gdshader'],
  },
  {
    id: 'cablesgl',
    name: 'Cables.gl',
    tier: 'partial',
    description: 'Patch detection, texture/asset linking, operator awareness',
    projectMarkers: ['*.cables'],
    extensions: ['cables', 'js', 'glsl'],
  },
  {
    id: 'blender',
    name: 'Blender',
    tier: 'partial',
    description: 'Asset detection, exported model correlation, texture mapping',
    projectMarkers: ['*.blend'],
    extensions: ['blend', 'fbx', 'obj', 'gltf', 'glb'],
  },
  {
    id: 'unity',
    name: 'Unity',
    tier: 'partial',
    description: 'Scene/prefab detection, asset classification, script dependency mapping',
    projectMarkers: ['Assets/', 'ProjectSettings/'],
    extensions: ['unity', 'prefab', 'asset', 'mat', 'controller'],
  },
  {
    id: 'touchdesigner',
    name: 'TouchDesigner',
    tier: 'partial',
    description: 'Network detection, COMP hierarchy, panel component awareness',
    projectMarkers: ['*.toe'],
    extensions: ['toe', 'tox'],
  },
  {
    id: 'ableton',
    name: 'Ableton Live',
    tier: 'reference',
    description: 'Session detection, audio file flagging for agent reference',
    projectMarkers: ['*.als'],
    extensions: ['als', 'adg', 'adv'],
  },
];

export function getEcosystemTier(ecosystemId: string): EcosystemTier {
  return ECOSYSTEMS.find(e => e.id === ecosystemId)?.tier ?? 'reference';
}
```

**UI Behavior per Tier:**

| Tier | Scan Behavior | Visual in Canvas | Cluster Support | Agent Context |
|------|--------------|-----------------|-----------------|---------------|
| **Full** | Walk + classify + parse + cluster | Full-color ecosystem borders, badges | ✅ Auto-clustering | ✅ Rich metadata |
| **Partial** | Walk + classify + light parse | Ecosystem border, "T0" badge | ⚠️ Manual only | ✅ Basic metadata |
| **Reference** | Walk + classify only | Dashed border, "REF" badge | ❌ None | ⚠️ Filename only |

**Deliverable**: Ecosystem toggle system defined. Frontend types ready.

---

### TASK 2.4: Markdown Notes with Preview/Edit + Toolbar

**Install dependency**:
```bash
npm install react-markdown
```

**File**: `src/components/canvas/nodes/NoteNode.tsx` (NEW)

```tsx
import { useState, useCallback, memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';

interface NoteNodeData {
  title: string;
  body: string;
  colorTag: string;
  objectId: string;
}

type NoteNodeProps = NodeProps & { data: NoteNodeData };

export const NoteNode = memo(function NoteNode({ data, selected }: NoteNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [body, setBody] = useState(data.body);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Persist changes via Tauri command
    // upsertCanvasObject({ id: data.objectId, data: { title, body } })
  }, [title, body, data.objectId]);

  const handleToolbarAction = useCallback((action: string) => {
    const textarea = document.querySelector(`[data-note-id="${data.objectId}"]`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    let replacement = '';

    switch (action) {
      case 'bold': replacement = `**${selectedText || 'bold text'}**`; break;
      case 'italic': replacement = `*${selectedText || 'italic text'}*`; break;
      case 'h1': replacement = `\n# ${selectedText || 'Heading 1'}\n`; break;
      case 'h2': replacement = `\n## ${selectedText || 'Heading 2'}\n`; break;
      case 'h3': replacement = `\n### ${selectedText || 'Heading 3'}\n`; break;
      case 'list': replacement = `\n- ${selectedText || 'list item'}\n`; break;
      case 'link': replacement = `[${selectedText || 'link text'}](url)`; break;
      case 'code': replacement = `\`${selectedText || 'code'}\``; break;
    }

    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);
  }, [body, data.objectId]);

  return (
    <div
      className={`note-node ${selected ? 'note-node--selected' : ''}`}
      style={{
        '--accent': data.colorTag,
        minWidth: 200,
        maxWidth: 400,
        backgroundColor: 'var(--color-bg)',
        border: selected ? '2px solid var(--color-border-focus)' : '1px solid var(--color-border)',
        borderLeft: `3px solid ${data.colorTag}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        padding: 'var(--space-3) var(--space-4)',
        fontSize: 'var(--text-sm)',
      } as React.CSSProperties}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />

      {isEditing ? (
        <div className="note-node__editor">
          {/* Toolbar */}
          <div style={{
            display: 'flex', gap: '2px', marginBottom: 'var(--space-2)',
            padding: 'var(--space-1)', backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}>
            {[
              { action: 'bold', label: 'B', style: { fontWeight: 'bold' as const } },
              { action: 'italic', label: 'I', style: { fontStyle: 'italic' as const } },
              { action: 'h1', label: 'H1', style: {} },
              { action: 'h2', label: 'H2', style: {} },
              { action: 'h3', label: 'H3', style: {} },
              { action: 'list', label: '•', style: {} },
              { action: 'link', label: '🔗', style: {} },
              { action: 'code', label: '<>', style: {} },
            ].map((btn) => (
              <button
                key={btn.action}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 6px', borderRadius: '3px', fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                }}
                onClick={(e) => { e.stopPropagation(); handleToolbarAction(btn.action); }}
                title={btn.action}
              >
                <span style={btn.style}>{btn.label}</span>
              </button>
            ))}
          </div>
          <input
            style={{
              width: '100%', border: 'none', borderBottom: '1px solid var(--color-border-light)',
              padding: 'var(--space-1) 0', fontSize: 'var(--text-base)', fontWeight: 600,
              fontFamily: 'var(--font-sans)', backgroundColor: 'transparent',
              color: 'var(--color-text)', outline: 'none', marginBottom: 'var(--space-2)',
            }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
          />
          <textarea
            data-note-id={data.objectId}
            style={{
              width: '100%', minHeight: 80, border: 'none', resize: 'vertical',
              fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
              backgroundColor: 'transparent', color: 'var(--color-text)',
              outline: 'none', lineHeight: 1.6,
            }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onBlur={handleBlur}
            placeholder="Write markdown here..."
            autoFocus
          />
        </div>
      ) : (
        <div className="note-node__preview">
          <h4 style={{
            fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-1)',
            color: 'var(--color-text)',
          }}>{title || 'Untitled Note'}</h4>
          <div style={{
            fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
            lineHeight: 1.6, maxHeight: 200, overflow: 'hidden',
          }}>
            <ReactMarkdown>{body || '*Double-click to edit*'}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
});
```

**File**: `src/components/canvas/nodes/index.ts` (NEW)

```typescript
import { NoteNode } from './NoteNode';
import { FileNode } from './FileNode';
import { ClusterNode } from './ClusterNode';
import type { NodeTypes } from '@xyflow/react';

export const nodeTypes: NodeTypes = {
  note: NoteNode,
  file: FileNode,
  cluster: ClusterNode,
  // Future: media, operator, folder, project
};
```

**Deliverable**: Double-click a note → editing mode with toolbar. Click away → preview mode with rendered markdown.

---

## DAY 3 — VISUAL DIFFERENTIATION + CONNECTION REPORT + FILE NODES

### TASK 3.1: Extended Color System CSS

**File**: `src/styles/colors.css` (NEW)

```css
/* ── Ecosystem colors ─────────────────────────────────── */
:root {
  --eco-godot:        #00d4ff;  /* Cyan — Godot Engine */
  --eco-blender:      #d4882a;  /* Amber — Blender */
  --eco-unity:        #888888;  /* Gray — Unity */
  --eco-touchdesigner:#259C52;  /* Green — TouchDesigner */
  --eco-cablesgl:     #7c3aed;  /* Purple — Cables.gl */
  --eco-ableton:      #eab308;  /* Yellow — Ableton Live */
  --eco-default:      #666666;  /* Dim gray — unknown / generic */

  /* ── Folder source colors (8-color palette) ─────────── */
  --folder-0: #00d4ff;
  --folder-1: #259C52;
  --folder-2: #d4882a;
  --folder-3: #7c3aed;
  --folder-4: #ff6ec4;
  --folder-5: #eab308;
  --folder-6: #e83737;
  --folder-7: #888888;

  /* ── Confidence levels ───────────────────────────────── */
  --confidence-high:   1.0;
  --confidence-medium: 0.7;
  --confidence-low:    0.4;

  /* ── Edge styles ─────────────────────────────────────── */
  --edge-confirmed:  solid;
  --edge-inferred:   dashed;
  --edge-user:       solid;
  --edge-portal:     dotted;

  /* ── State colors ────────────────────────────────────── */
  --state-hover-border:    2px;
  --state-selected-glow:   0 0 8px;
}

/* ── Ecosystem border treatments ──────────────────────── */
.node--godot        { border-left-color: var(--eco-godot) !important; }
.node--blender      { border-left-color: var(--eco-blender) !important; }
.node--unity        { border-left-color: var(--eco-unity) !important; }
.node--touchdesigner{ border-left-color: var(--eco-touchdesigner) !important; }
.node--cablesgl     { border-left-color: var(--eco-cablesgl) !important; }
.node--ableton      { border-left-color: var(--eco-ableton) !important; }
.node--unknown      { border-left-color: var(--eco-default) !important; }
.node--canvas-native{ border-left-color: var(--color-accent) !important; }

/* ── Folder corner tags ───────────────────────────────── */
.folder-tag {
  position: absolute;
  top: 0; right: 0;
  width: 0; height: 0;
  border-style: solid;
  border-width: 0 10px 10px 0;
}
.folder-tag--0  { border-right-color: var(--folder-0); }
.folder-tag--1  { border-right-color: var(--folder-1); }
.folder-tag--2  { border-right-color: var(--folder-2); }
.folder-tag--3  { border-right-color: var(--folder-3); }
.folder-tag--4  { border-right-color: var(--folder-4); }
.folder-tag--5  { border-right-color: var(--folder-5); }
.folder-tag--6  { border-right-color: var(--folder-6); }
.folder-tag--7  { border-right-color: var(--folder-7); }

/* ── Edge confidence opacity ──────────────────────────── */
.edge--high    { opacity: var(--confidence-high); }
.edge--medium  { opacity: var(--confidence-medium); }
.edge--low     { opacity: var(--confidence-low); }

/* ── Edge type dashes ─────────────────────────────────── */
.edge--inferred { stroke-dasharray: 8 4; }
.edge--portal   { stroke-dasharray: 2 4; stroke-width: 2px; }

/* ── Tier badges ──────────────────────────────────────── */
.tier-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
}
.tier-badge--full      { background: rgba(0, 212, 255, 0.12); color: var(--eco-godot); }
.tier-badge--partial   { background: rgba(37, 156, 82, 0.12); color: var(--eco-touchdesigner); }
.tier-badge--reference { background: rgba(102, 102, 102, 0.12); color: var(--eco-default); }
```

**Import in `src/styles/globals.css`**:
```css
@import './colors.css';
```

**Deliverable**: Full color semantics system ready.

---

### TASK 3.2: File Node Component

**File**: `src/components/canvas/nodes/FileNode.tsx` (NEW)

```tsx
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

interface FileNodeData {
  label: string;
  classification: string;
  ecosystem: string;
  folderColorIndex: number;
  tier: 'full' | 'partial' | 'reference';
  path: string;
}

const ECOSYSTEM_ICONS: Record<string, string> = {
  godot: '🎮', blender: '🧊', unity: '⬛', touchdesigner: '🔌',
  cablesgl: '🔷', ableton: '🎵', unknown: '📄',
};

export const FileNode = memo(function FileNode({ data, selected }: NodeProps & { data: FileNodeData }) {
  const ecoClass = `node--${data.ecosystem || 'unknown'}`;
  const icon = ECOSYSTEM_ICONS[data.ecosystem] || ECOSYSTEM_ICONS.unknown;

  return (
    <div
      className={`file-node ${ecoClass} ${selected ? 'node--selected' : ''}`}
      style={{
        backgroundColor: 'var(--color-bg)',
        border: selected ? '2px solid var(--color-border-focus)' : '1px solid var(--color-border)',
        borderLeft: `3px solid var(--eco-${data.ecosystem || 'default'})`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-2) var(--space-3)',
        fontSize: 'var(--text-sm)',
        minWidth: 140,
        maxWidth: 240,
        position: 'relative',
        boxShadow: selected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      } as React.CSSProperties}
    >
      <div className={`folder-tag folder-tag--${data.folderColorIndex % 8}`} />

      {data.tier !== 'full' && (
        <span className={`tier-badge tier-badge--${data.tier}`}
          style={{ position: 'absolute', top: 2, left: 4 }}>
          {data.tier === 'partial' ? 'T0' : 'REF'}
        </span>
      )}

      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.label}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            {data.classification}
          </div>
        </div>
      </div>
    </div>
  );
});
```

**Deliverable**: File nodes visually distinct by ecosystem, folder source, and support tier.

---

### TASK 3.3: Connection Report Component

**File**: `src/components/canvas/ConnectionReport.tsx` (NEW)

```tsx
interface ConnectionSuggestion {
  id: string;
  suggestion_type: string;
  source_node_id: string | null;
  target_node_id: string | null;
  proposed_edge_type: string | null;
  confidence: number;
  reason: string;
  evidence: Array<{ evidence_type: string; detail: string }>;
  status: 'pending' | 'accepted' | 'rejected' | 'deferred';
}

interface ConnectionReportProps {
  suggestions: ConnectionSuggestion[];
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onDefer: (id: string) => void;
  onAcceptAll: () => void;
  onClose: () => void;
}

export function ConnectionReport({
  suggestions, onAccept, onDismiss, onDefer, onAcceptAll, onClose,
}: ConnectionReportProps) {
  const pending = suggestions.filter(s => s.status === 'pending');

  if (pending.length === 0) {
    return (
      <div style={panelStyles}>
        <div style={headerStyles}>
          <h3>Connection Report</h3>
          <button onClick={onClose} style={closeBtnStyles}>×</button>
        </div>
        <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-tertiary)' }}>
          No pending suggestions.
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyles}>
      <div style={headerStyles}>
        <h3>Connection Report ({pending.length})</h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={onAcceptAll} style={acceptAllBtnStyles}>Accept All</button>
          <button onClick={onClose} style={closeBtnStyles}>×</button>
        </div>
      </div>
      <div style={listStyles}>
        {pending.map((s) => (
          <SuggestionCard key={s.id} suggestion={s}
            onAccept={() => onAccept(s.id)}
            onDismiss={() => onDismiss(s.id)}
            onDefer={() => onDefer(s.id)} />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion, onAccept, onDismiss, onDefer }: {
  suggestion: ConnectionSuggestion;
  onAccept: () => void;
  onDismiss: () => void;
  onDefer: () => void;
}) {
  const confPct = Math.round(suggestion.confidence * 100);
  const confColor = confPct >= 80 ? 'var(--eco-touchdesigner)'
    : confPct >= 50 ? 'var(--eco-ableton)'
    : 'var(--eco-default)';

  return (
    <div style={cardStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
          {suggestion.proposed_edge_type}
        </span>
        <span style={{
          background: `${confColor}20`, color: confColor,
          padding: '1px 6px', borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
        }}>
          {confPct}%
        </span>
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
        {suggestion.reason}
      </div>
      {suggestion.evidence && suggestion.evidence.length > 0 && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-2)' }}>
          {suggestion.evidence.map((e, i) => (
            <span key={i} style={{ marginRight: 'var(--space-2)' }}>
              • {e.evidence_type}: {e.detail}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button onClick={onAccept} style={acceptBtnStyles}>Accept</button>
        <button onClick={onDismiss} style={dismissBtnStyles}>Dismiss</button>
        <button onClick={onDefer} style={deferBtnStyles}>Later</button>
      </div>
    </div>
  );
}

const panelStyles: React.CSSProperties = {
  position: 'absolute', top: 0, right: 0, width: 360, height: '100%',
  backgroundColor: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-lg)', zIndex: 50,
  display: 'flex', flexDirection: 'column',
};
const headerStyles: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)',
};
const listStyles: React.CSSProperties = {
  flex: 1, overflow: 'auto', padding: 'var(--space-3)',
};
const cardStyles: React.CSSProperties = {
  padding: 'var(--space-3)', border: '1px solid var(--color-border-light)',
  borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)',
};
const closeBtnStyles: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer',
  color: 'var(--color-text-tertiary)',
};
const acceptBtnStyles: React.CSSProperties = {
  padding: '2px 12px', fontSize: 'var(--text-xs)', fontWeight: 600,
  backgroundColor: 'var(--eco-touchdesigner)', color: '#fff',
  border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
};
const dismissBtnStyles: React.CSSProperties = {
  ...acceptBtnStyles, backgroundColor: 'var(--color-bg-secondary)',
  color: 'var(--color-text-secondary)',
};
const deferBtnStyles: React.CSSProperties = {
  ...acceptBtnStyles, backgroundColor: 'transparent',
  border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)',
};
const acceptAllBtnStyles: React.CSSProperties = {
  ...acceptBtnStyles, backgroundColor: 'var(--eco-touchdesigner)',
};
```

**Deliverable**: Connection report panel renders. Accept/dismiss/defer/accept-all work.

---

## DAY 4 — SUB-CANVAS + INTELLIGENCE PIPELINE + INTEGRATION

### TASK 4.1: Sub-Canvas Navigation

**File**: `src/components/canvas/SubCanvas.tsx` (NEW)

Handles canvas tree navigation. Each canvas is a separate ReactFlow instance.

**File**: `src/components/canvas/BreadcrumbBar.tsx` (NEW)

```tsx
interface BreadcrumbItem { id: string; label: string; }

export function BreadcrumbBar({ path, onNavigate }: {
  path: BreadcrumbItem[];
  onNavigate: (id: string) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
      padding: 'var(--space-2) var(--space-4)',
      backgroundColor: 'var(--color-bg-secondary)',
      borderBottom: '1px solid var(--color-border-light)',
      fontSize: 'var(--text-sm)',
    }}>
      {path.map((item, i) => (
        <span key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          {i > 0 && <span style={{ color: 'var(--color-text-tertiary)' }}>/</span>}
          <button
            onClick={() => onNavigate(item.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: i === path.length - 1 ? 'var(--color-text)' : 'var(--color-text-secondary)',
              fontWeight: i === path.length - 1 ? 600 : 400,
              fontSize: 'var(--text-sm)',
            }}
          >
            {item.label}
          </button>
        </span>
      ))}
    </div>
  );
}
```

**Deliverable**: Double-click cluster → transition to sub-canvas. Breadcrumb shows path.

---

### TASK 4.2: Intelligence Pipeline Wiring

**File**: `src-tauri/src/intelligence/clustering.rs` (NEW)

```rust
use crate::intelligence::AdapterRegistry;
use crate::intelligence::adapters;
use crate::graph::types::GraphNode;

pub struct ClusteringEngine {
    registry: AdapterRegistry,
}

impl ClusteringEngine {
    pub fn new() -> Self {
        let mut registry = AdapterRegistry::new();
        adapters::register_all(&mut registry);
        ClusteringEngine { registry }
    }

    pub fn run(&self, nodes: &[GraphNode]) -> Vec<super::ClusteringHint> {
        let mut hints = Vec::new();

        for adapter in self.registry.get_all() {
            let ecosystem_nodes: Vec<GraphNode> = nodes.iter()
                .filter(|n| {
                    n.classification.as_deref().map_or(false, |c| {
                        adapter.ecosystem_info().extensions.iter().any(|ext| c.contains(ext))
                    })
                })
                .cloned()
                .collect();

            if !ecosystem_nodes.is_empty() {
                let ecosystem_hints = adapter.suggest_clusters(&ecosystem_nodes);
                hints.extend(ecosystem_hints);
            }
        }

        hints.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        hints
    }
}
```

**File**: `src-tauri/src/intelligence/linking.rs` (NEW)

Connection inference based on naming patterns, same-folder proximity, and import graph data.

**Deliverable**: Intelligence pipeline runs post-scan.

---

### TASK 4.3: Wire Intelligence in `scan_cmd.rs`

**File**: `src-tauri/src/commands/scan_cmd.rs` (MODIFY)

Add after the existing persist step:
```rust
// Step 4: Run intelligence pipeline
let engine = crate::intelligence::clustering::ClusteringEngine::new();
let hints = engine.run(&walk_result.nodes);

app_handle.emit("intelligence:suggestions", &hints)
    .map_err(|e| e.to_string())?;
```

**Deliverable**: Full scan → parse → cluster pipeline.

---

### TASK 4.4: `useCanvas` Hook

**File**: `src/hooks/useCanvas.ts` (NEW)

```typescript
import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { CanvasStateData, CanvasObjectData } from '../core/canvas';

export function useCanvas(projectId: string) {
  const [canvasStack, setCanvasStack] = useState<CanvasStateData[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<CanvasStateData | null>(null);

  const navigate = useCallback(async (canvasId: string) => {
    const state = await invoke<CanvasStateData>('load_canvas_state', { projectId, canvasId });
    setCurrentCanvas(state);
    setCanvasStack(prev => [...prev, state]);
  }, [projectId]);

  const goBack = useCallback(() => {
    setCanvasStack(prev => {
      const next = prev.slice(0, -1);
      setCurrentCanvas(next[next.length - 1] || null);
      return next;
    });
  }, []);

  const createNote = useCallback(async (x: number, y: number) => {
    if (!currentCanvas) return;
    const obj: CanvasObjectData = {
      id: crypto.randomUUID(),
      canvas_id: currentCanvas.id,
      project_id: projectId,
      object_type: 'note',
      position_x: x, position_y: y,
      width: 240, height: 160,
      z_index: Date.now(),
      data: { title: '', body: '', colorTag: '#00d4ff' },
    };
    await invoke('upsert_canvas_object', { obj });
    await navigate(currentCanvas.id);
  }, [currentCanvas, projectId, navigate]);

  return { currentCanvas, navigate, goBack, createNote, canvasStack };
}
```

**Deliverable**: Canvas state hook with navigation and note creation.

---

## DAY 5 — POLISH, INTEGRATION, DEMO

### TASK 5.1: Final Integration — App.tsx Rewrite

Wire all new components into the app shell:
- Auth → ProjectSetup → Canvas (with SubCanvas + BreadcrumbBar)
- ConnectionReport as slide-over
- Sidebar with linked folders + canvas tree

### TASK 5.2: SpacetimeDB Demo Module

**File**: `spacetime-module/src/lib.rs` (NEW — separate crate)

```rust
use spacetimedb::{spacetimedb, ReducerContext, Table};

#[spacetimedb(table)]
pub struct AraNode {
    #[primary_key]
    id: String,
    project_id: String,
    node_type: String,
    label: String,
    data_json: String,
}

#[spacetimedb(reducer)]
pub fn insert_nodes(ctx: &ReducerContext, nodes: Vec<AraNode>) {
    for node in nodes {
        ctx.db.ara_node().insert(node);
    }
}
```

Publish with:
```bash
cd spacetime-module
spacetime publish -s local project-ara
```

### TASK 5.3: Render Auth Server Deploy

```bash
cd server
npm install pg
git add .
git commit -m "auth server: render-ready with postgres support"
git push
# Deploy via Render Blueprint (render.yaml) or manual web service
```

### TASK 5.4: Demo Script

1. Launch app → Auth screen (connects to Render-hosted auth server)
2. Sign in → First-run: create "My Creative Project"
3. Add Godot folder → Scan → Clusters appear ("Player", "Enemy", "World")
4. Connection report slides in → Accept connections
5. Double-click canvas → Note appears → Type markdown with toolbar
6. Drag image from desktop → Media block created
7. Double-click "Player" cluster → Sub-canvas opens
8. Breadcrumb shows: `Project / Characters / Player`
9. SpacetimeDB status indicator shows "Connected" in settings
10. Add Blender folder (Tier Partial) → Files appear with "T0" badge, amber borders

### TASK 5.5: Test & Fix

- Test on a real Godot project (50+ files)
- Test multi-folder with different ecosystems
- Test note creation, editing, preview, persistence
- Test connection report accept/dismiss flow
- Verify SpacetimeDB connection indicator
- Fix any render/state bugs

---

## COMPLETE FILE MANIFEST

| File | Status | Day |
|------|--------|-----|
| `src-tauri/Cargo.toml` | MODIFY | 1 |
| `src-tauri/src/spacetimedb/mod.rs` | NEW | 1 |
| `src-tauri/src/spacetimedb/schema.rs` | NEW | 1 |
| `src-tauri/src/spacetimedb/reducer.rs` | NEW | 1 |
| `src-tauri/src/lib.rs` | MODIFY | 1 |
| `server/auth.js` | MODIFY | 1 |
| `server/package.json` | MODIFY | 1 |
| `server/render.yaml` | NEW | 1 |
| `server/Dockerfile` | NEW | 1 |
| `src-tauri/src/graph/schema.rs` | MODIFY | 1 |
| `src-tauri/src/commands/canvas_cmd.rs` | NEW | 1 |
| `src-tauri/src/commands/mod.rs` | MODIFY | 1 |
| `src-tauri/src/intelligence/mod.rs` | NEW | 2 |
| `src-tauri/src/intelligence/adapters/mod.rs` | NEW | 2 |
| `src-tauri/src/intelligence/adapters/godot.rs` | NEW | 2 |
| `src-tauri/src/intelligence/clustering.rs` | NEW | 2 |
| `src-tauri/src/intelligence/linking.rs` | NEW | 2 |
| `src/core/ecosystem.ts` | NEW | 2 |
| `src/core/canvas.ts` | NEW | 2 |
| `src/components/canvas/nodes/NoteNode.tsx` | NEW | 2 |
| `src/components/canvas/nodes/FileNode.tsx` | NEW | 3 |
| `src/components/canvas/nodes/ClusterNode.tsx` | NEW | 3 |
| `src/components/canvas/nodes/index.ts` | NEW | 2 |
| `src/styles/colors.css` | NEW | 3 |
| `src/styles/globals.css` | MODIFY | 3 |
| `src/components/canvas/ConnectionReport.tsx` | NEW | 3 |
| `src/hooks/useCanvas.ts` | NEW | 4 |
| `src/hooks/useIntelligence.ts` | NEW | 4 |
| `src/components/canvas/SubCanvas.tsx` | NEW | 4 |
| `src/components/canvas/BreadcrumbBar.tsx` | NEW | 4 |
| `src-tauri/src/commands/scan_cmd.rs` | MODIFY | 4 |
| `src/components/canvas/GraphCanvas.tsx` | MODIFY | 4 |
| `src/App.tsx` | MODIFY | 5 |
| `spacetime-module/src/lib.rs` | NEW | 5 |
| `package.json` | MODIFY | 2 |

**Total: ~25 new files, ~8 modified files.**

---

## RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SpacetimeDB SDK incompatible with Rust edition | Medium | High | Use REST API fallback instead of native SDK |
| `better-sqlite3` → `pg` migration breaks Better Auth | Medium | High | Test locally with Docker PostgreSQL first |
| ReactFlow custom nodes performance with 500+ nodes | Medium | Medium | Use React.memo, limit re-renders, test early |
| `react-markdown` bundle size | Low | Low | Acceptable; tree-shake if needed |
| Render free tier cold start for auth | Low | Medium | Acceptable for demo; add health-check endpoint |
| Multi-folder scan race conditions | Low | Medium | Sequential scanning (not parallel) for MVP |

---

## OPEN QUESTIONS RESOLVED

**OQRHI #4 — MCP Integration Depth:**
→ **Decision**: Context provisioning first. Agent can read the graph/canvas state but cannot execute tool actions. The `agent_configs` table stores `permissions: { read: true, write: false }` with `enabled: 0` by default.

**OQRHI #5 — Light Mode Priority:**
→ **Decision**: Dark default, structural light mode via existing CSS variables. Add a manual theme toggle in Settings panel. No light-mode-specific design work needed.

**OQRHI #6 — Plugin System Timing:**
→ **Decision**: Not before 5+ adapters. The `EcosystemAdapter` trait is the extension point. Each new ecosystem adds one file in `intelligence/adapters/`. When we have Godot + Blender + Unity + TouchDesigner + Cables.gl adapters (5 total), revisit.

---

## ACCEPTANCE CRITERIA

- [ ] App launches, connects to Render-hosted auth server, sign-in works
- [ ] User creates project with 2 folders (Godot + Blender)
- [ ] Godot folder scan produces clusters (name-based grouping)
- [ ] Blender folder files show "T0" partial tier badge, amber borders
- [ ] Connection report appears with scored suggestions
- [ ] Accept/dismiss/defer actions work and persist
- [ ] Double-click canvas creates note
- [ ] Note has toolbar (bold, italic, headings, list, link, code)
- [ ] Note shows rendered markdown preview when not editing
- [ ] Note persists across app restart
- [ ] File nodes show ecosystem-colored left border
- [ ] File nodes from different folders show distinct corner tags
- [ ] SpacetimeDB connection indicator visible in settings
- [ ] Sub-canvas navigation: double-click cluster → new canvas, breadcrumb works
- [ ] Settings panel has Theme toggle (System/Dark/Light)
- [ ] Settings panel has Agent Configuration section with MCP endpoint input
