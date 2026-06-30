/**
 * Tauri command bindings.
 *
 * All Rust commands are accessed through typed wrappers here.
 * This is the single point of coupling to the Tauri IPC layer.
 */

import { invoke } from "@tauri-apps/api/core";
import type { GraphNode, GraphEdge, GraphSnapshot } from "../../core/graph";
import type { CanvasObjectData, CanvasStateData } from "../../core/canvas";
import type {
  UserProfile,
  TOTPSetup,
  WebAuthnChallenge,
} from "../../core/auth";

// ── OAuth ────────────────────────────────────────────────────────────

export async function signIn(
  provider: string,
  clientId: string,
  clientSecret: string,
): Promise<UserProfile> {
  return invoke<UserProfile>("sign_in", { provider, clientId, clientSecret });
}

// ── Local auth (username/password) ───────────────────────────────────

export async function signUpLocal(
  username: string,
  email: string | null,
  password: string,
): Promise<UserProfile> {
  return invoke<UserProfile>("sign_up_local", { username, email, password });
}

export async function signInLocal(
  username: string,
  password: string,
  totpCode: string | null,
): Promise<UserProfile> {
  return invoke<UserProfile>("sign_in_local", { username, password, totpCode });
}

// ── 2FA / TOTP ──────────────────────────────────────────────────────

export async function setupTotp(): Promise<TOTPSetup> {
  return invoke<TOTPSetup>("setup_totp");
}

export async function enableTotp(
  secret: string,
  code: string,
): Promise<boolean> {
  return invoke<boolean>("enable_totp", { secret, code });
}

// ── Passkeys / WebAuthn ──────────────────────────────────────────────

export async function webauthnRegisterChallenge(): Promise<WebAuthnChallenge> {
  return invoke<WebAuthnChallenge>("webauthn_register_challenge");
}

export async function webauthnRegisterVerify(
  credentialId: string,
  publicKey: string,
): Promise<void> {
  return invoke<void>("webauthn_register_verify", { credentialId, publicKey });
}

export async function webauthnAuthChallenge(): Promise<WebAuthnChallenge> {
  return invoke<WebAuthnChallenge>("webauthn_auth_challenge");
}

export async function webauthnAuthVerify(
  credentialId: string,
): Promise<UserProfile> {
  return invoke<UserProfile>("webauthn_auth_verify", { credentialId });
}

// ── Mock login ──────────────────────────────────────────────────────

export async function mockLogin(): Promise<UserProfile> {
  return invoke<UserProfile>("mock_login");
}

// ── Session management ──────────────────────────────────────────────

export async function restoreSession(): Promise<UserProfile | null> {
  return invoke<UserProfile | null>("restore_session");
}

export async function signOut(): Promise<void> {
  return invoke<void>("sign_out");
}

export async function getSession(): Promise<UserProfile | null> {
  return invoke<UserProfile | null>("get_session");
}

// ── Project ─────────────────────────────────────────────────────────

export async function bootstrapProject(projectRoot: string): Promise<string> {
  return invoke<string>("bootstrap_project", { projectRoot });
}

// ── Scan ────────────────────────────────────────────────────────────

export async function scanProject(projectRoot: string): Promise<GraphSnapshot> {
  return invoke<GraphSnapshot>("scan_project", { projectRoot });
}

// ── Graph ───────────────────────────────────────────────────────────

export async function getGraph(projectRoot: string): Promise<GraphSnapshot> {
  return invoke<GraphSnapshot>("get_graph", { projectRoot });
}

export async function getGraphNode(
  projectRoot: string,
  nodeId: string,
): Promise<GraphNode | null> {
  return invoke<GraphNode | null>("get_graph_node", { projectRoot, nodeId });
}

export async function getGraphNodeEdges(
  projectRoot: string,
  nodeId: string,
): Promise<GraphEdge[]> {
  return invoke<GraphEdge[]>("get_graph_node_edges", { projectRoot, nodeId });
}

// ── Canvas state ────────────────────────────────────────────────────

export async function upsertCanvasObject(obj: CanvasObjectData): Promise<void> {
  return invoke<void>("upsert_canvas_object", { obj });
}

export async function upsertCanvasState(canvas: CanvasStateData): Promise<void> {
  return invoke<void>("upsert_canvas_state", { canvas });
}

export async function loadCanvasState(
  projectId: string,
  canvasId: string,
): Promise<CanvasStateData> {
  return invoke<CanvasStateData>("load_canvas_state", { projectId, canvasId });
}

export async function deleteCanvasObject(objectId: string): Promise<void> {
  return invoke<void>("delete_canvas_object", { objectId });
}

export async function saveViewport(
  canvasId: string,
  x: number,
  y: number,
  zoom: number,
): Promise<void> {
  return invoke<void>("save_viewport", { canvasId, x, y, zoom });
}

// ── SpacetimeDB (wired, not synced) ─────────────────────────────────

export interface SpacetimeStatus {
  connected: boolean;
  identity: string | null;
  uri: string | null;
  module: string | null;
}

export async function getSpacetimedbStatus(): Promise<SpacetimeStatus> {
  return invoke<SpacetimeStatus>("get_spacetimedb_status");
}
