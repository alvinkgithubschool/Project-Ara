use rusqlite::Connection;

use super::types::{GraphEdge, GraphNode, GraphSnapshot};
use crate::utils::error::AppError;

/// Clear all nodes and edges from the database.
pub fn clear_graph(conn: &Connection) -> Result<(), AppError> {
    conn.execute("DELETE FROM edges", [])?;
    conn.execute("DELETE FROM nodes", [])?;
    Ok(())
}

/// Insert a batch of nodes.
pub fn insert_nodes(conn: &Connection, nodes: &[GraphNode]) -> Result<(), AppError> {
    let mut stmt = conn.prepare(
        "INSERT OR REPLACE INTO nodes (id, node_type, label, file_path, classification, metadata, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
    )?;

    for node in nodes {
        stmt.execute(rusqlite::params![
            node.id,
            node.node_type.as_str(),
            node.label,
            node.file_path,
            node.classification,
            serde_json::to_string(&node.metadata).unwrap_or_default(),
            node.created_at,
            node.updated_at,
        ])?;
    }

    Ok(())
}

/// Insert a batch of edges.
pub fn insert_edges(conn: &Connection, edges: &[GraphEdge]) -> Result<(), AppError> {
    let mut stmt = conn.prepare(
        "INSERT OR REPLACE INTO edges (id, edge_type, source_id, target_id, label, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )?;

    for edge in edges {
        stmt.execute(rusqlite::params![
            edge.id,
            edge.edge_type.as_str(),
            edge.source_id,
            edge.target_id,
            edge.label,
            serde_json::to_string(&edge.metadata).unwrap_or_default(),
        ])?;
    }

    Ok(())
}

/// Query the full graph as a snapshot.
pub fn get_full_graph(conn: &Connection) -> Result<GraphSnapshot, AppError> {
    let mut node_stmt = conn.prepare(
        "SELECT id, node_type, label, file_path, classification, metadata, created_at, updated_at FROM nodes",
    )?;

    let nodes: Vec<GraphNode> = node_stmt
        .query_map([], |row| {
            let metadata_str: String = row.get(5)?;
            Ok(GraphNode {
                id: row.get(0)?,
                node_type: super::types::NodeType::from_str(&row.get::<_, String>(1)?)
                    .unwrap_or(super::types::NodeType::File),
                label: row.get(2)?,
                file_path: row.get(3)?,
                classification: row.get(4)?,
                metadata: serde_json::from_str(&metadata_str).unwrap_or_default(),
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut edge_stmt = conn.prepare(
        "SELECT id, edge_type, source_id, target_id, label, metadata FROM edges",
    )?;

    let edges: Vec<GraphEdge> = edge_stmt
        .query_map([], |row| {
            let metadata_str: String = row.get(5)?;
            Ok(GraphEdge {
                id: row.get(0)?,
                edge_type: super::types::EdgeType::from_str(&row.get::<_, String>(1)?)
                    .unwrap_or(super::types::EdgeType::Contains),
                source_id: row.get(2)?,
                target_id: row.get(3)?,
                label: row.get(4)?,
                metadata: serde_json::from_str(&metadata_str).unwrap_or_default(),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(GraphSnapshot { nodes, edges })
}

/// Get a single node by ID.
pub fn get_node(conn: &Connection, node_id: &str) -> Result<Option<GraphNode>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, node_type, label, file_path, classification, metadata, created_at, updated_at
         FROM nodes WHERE id = ?1",
    )?;

    let mut rows = stmt.query_map([node_id], |row| {
        let metadata_str: String = row.get(5)?;
        Ok(GraphNode {
            id: row.get(0)?,
            node_type: super::types::NodeType::from_str(&row.get::<_, String>(1)?)
                .unwrap_or(super::types::NodeType::File),
            label: row.get(2)?,
            file_path: row.get(3)?,
            classification: row.get(4)?,
            metadata: serde_json::from_str(&metadata_str).unwrap_or_default(),
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    })?;

    match rows.next() {
        Some(result) => Ok(Some(result?)),
        None => Ok(None),
    }
}

/// Get edges for a specific node (both outgoing and incoming).
pub fn get_node_edges(conn: &Connection, node_id: &str) -> Result<Vec<GraphEdge>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, edge_type, source_id, target_id, label, metadata
         FROM edges WHERE source_id = ?1 OR target_id = ?1",
    )?;

    let edges: Vec<GraphEdge> = stmt
        .query_map([node_id], |row| {
            let metadata_str: String = row.get(5)?;
            Ok(GraphEdge {
                id: row.get(0)?,
                edge_type: super::types::EdgeType::from_str(&row.get::<_, String>(1)?)
                    .unwrap_or(super::types::EdgeType::Contains),
                source_id: row.get(2)?,
                target_id: row.get(3)?,
                label: row.get(4)?,
                metadata: serde_json::from_str(&metadata_str).unwrap_or_default(),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(edges)
}
