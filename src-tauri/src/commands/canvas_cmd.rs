//! Canvas state CRUD commands.
//!
//! Canvas objects (notes, media, operators, …) and per-canvas viewport state
//! live in the global `projects.db` (see `graph::schema::initialize_projects_db`),
//! separate from the per-project `.ara/graph.db` scan graph.

use serde::{Deserialize, Serialize};
use tauri::Manager;

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

/// Resolve the path to the global `projects.db`.
fn projects_db_path(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let state = app_handle.state::<crate::AppDataState>();
    let app_data_dir = state.app_data_dir.lock().map_err(|e| e.to_string())?.clone();
    Ok(app_data_dir.join("projects.db"))
}

/// Save or update a canvas object (note, media, operator, etc.)
#[tauri::command]
pub async fn upsert_canvas_object(
    app_handle: tauri::AppHandle,
    obj: CanvasObjectData,
) -> Result<(), String> {
    let db_path = projects_db_path(&app_handle)?;
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR REPLACE INTO canvas_objects
         (id, canvas_id, project_id, object_type, position_x, position_y, width, height, z_index, data, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                 COALESCE((SELECT created_at FROM canvas_objects WHERE id = ?1), ?11),
                 ?11)",
        rusqlite::params![
            obj.id,
            obj.canvas_id,
            obj.project_id,
            obj.object_type,
            obj.position_x,
            obj.position_y,
            obj.width,
            obj.height,
            obj.z_index,
            serde_json::to_string(&obj.data).unwrap_or_default(),
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Load canvas state including all objects for a given canvas.
#[tauri::command]
pub async fn load_canvas_state(
    app_handle: tauri::AppHandle,
    project_id: String,
    canvas_id: String,
) -> Result<CanvasStateData, String> {
    let _ = project_id;
    let db_path = projects_db_path(&app_handle)?;
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;

    let canvas: CanvasStateData = conn
        .query_row(
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
        )
        .map_err(|e| format!("Canvas not found: {e}"))?;

    let mut stmt = conn
        .prepare(
            "SELECT id, canvas_id, project_id, object_type, position_x, position_y,
                    width, height, z_index, data
             FROM canvas_objects WHERE canvas_id = ?1 ORDER BY z_index",
        )
        .map_err(|e| e.to_string())?;

    let objects: Vec<CanvasObjectData> = stmt
        .query_map([&canvas_id], |row| {
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
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(CanvasStateData { objects, ..canvas })
}

/// Delete a canvas object.
#[tauri::command]
pub async fn delete_canvas_object(
    app_handle: tauri::AppHandle,
    object_id: String,
) -> Result<(), String> {
    let db_path = projects_db_path(&app_handle)?;
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM canvas_objects WHERE id = ?1", [&object_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Create or update a canvas (used to seed a root canvas for a project, or to
/// create a sub-canvas when drilling into a cluster).
#[tauri::command]
pub async fn upsert_canvas_state(
    app_handle: tauri::AppHandle,
    canvas: CanvasStateData,
) -> Result<(), String> {
    let db_path = projects_db_path(&app_handle)?;
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR REPLACE INTO canvas_state
         (id, project_id, parent_canvas_id, label, viewport_x, viewport_y, viewport_zoom, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7,
                 COALESCE((SELECT created_at FROM canvas_state WHERE id = ?1), ?8),
                 ?8)",
        rusqlite::params![
            canvas.id,
            canvas.project_id,
            canvas.parent_canvas_id,
            canvas.label,
            canvas.viewport_x,
            canvas.viewport_y,
            canvas.viewport_zoom,
            now,
        ],
    )
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
    let db_path = projects_db_path(&app_handle)?;
    let conn = rusqlite::Connection::open(&db_path).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE canvas_state SET viewport_x = ?1, viewport_y = ?2, viewport_zoom = ?3,
         updated_at = ?4 WHERE id = ?5",
        rusqlite::params![x, y, zoom, chrono::Utc::now().to_rfc3339(), canvas_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
