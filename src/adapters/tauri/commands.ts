/**
 * Tauri command bindings.
 *
 * All Rust commands are accessed through typed wrappers here.
 * This is the single point of coupling to the Tauri IPC layer.
 */

import { invoke } from '@tauri-apps/api/core';
import type { GraphNode, GraphEdge, GraphSnapshot } from '../../core/graph';
import type { UserProfile } from '../../core/auth';

// ── Auth ────────────────────────────────────────────────────────────

export async function signIn(
  provider: string,
  clientId: string,
  clientSecret: string,
): Promise<UserProfile> {
  return invoke<UserProfile>('sign_in', {
    provider,
    clientId,
    clientSecret,
  });
}

export async function restoreSession(): Promise<UserProfile | null> {
  return invoke<UserProfile | null>('restore_session');
}

export async function signOut(): Promise<void> {
  return invoke<void>('sign_out');
}

export async function getSession(): Promise<UserProfile | null> {
  return invoke<UserProfile | null>('get_session');
}

// ── Project ─────────────────────────────────────────────────────────

export async function bootstrapProject(projectRoot: string): Promise<string> {
  return invoke<string>('bootstrap_project', { projectRoot });
}

// ── Scan ────────────────────────────────────────────────────────────

export async function scanProject(projectRoot: string): Promise<GraphSnapshot> {
  return invoke<GraphSnapshot>('scan_project', { projectRoot });
}

// ── Graph ───────────────────────────────────────────────────────────

export async function getGraph(projectRoot: string): Promise<GraphSnapshot> {
  return invoke<GraphSnapshot>('get_graph', { projectRoot });
}

export async function getGraphNode(
  projectRoot: string,
  nodeId: string,
): Promise<GraphNode | null> {
  return invoke<GraphNode | null>('get_graph_node', {
    projectRoot,
    nodeId,
  });
}

export async function getGraphNodeEdges(
  projectRoot: string,
  nodeId: string,
): Promise<GraphEdge[]> {
  return invoke<GraphEdge[]>('get_graph_node_edges', {
    projectRoot,
    nodeId,
  });
}
