import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import type { ConnectionSuggestion, ClusteringHint } from "../core/canvas";

/**
 * Subscribes to intelligence events emitted by the Rust scan pipeline
 * (`intelligence:suggestions` and `intelligence:clusters`) and exposes
 * accept/dismiss/defer actions for the Connection Report.
 *
 * Accept/dismiss/defer currently mutate suggestion status locally (demo scope);
 * persisting accepted edges into the graph is a follow-up (see FIXLIST).
 */
export function useIntelligence() {
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [clusters, setClusters] = useState<ClusteringHint[]>([]);

  useEffect(() => {
    const unlistenPromises = [
      listen<ConnectionSuggestion[]>("intelligence:suggestions", (event) => {
        setSuggestions(event.payload ?? []);
      }),
      listen<ClusteringHint[]>("intelligence:clusters", (event) => {
        setClusters(event.payload ?? []);
      }),
    ];
    return () => {
      unlistenPromises.forEach((p) => p.then((un) => un()));
    };
  }, []);

  const setStatus = useCallback(
    (id: string, status: ConnectionSuggestion["status"]) => {
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s)),
      );
    },
    [],
  );

  const onAccept = useCallback((id: string) => setStatus(id, "accepted"), [setStatus]);
  const onDismiss = useCallback((id: string) => setStatus(id, "rejected"), [setStatus]);
  const onDefer = useCallback((id: string) => setStatus(id, "deferred"), [setStatus]);

  const onAcceptAll = useCallback(() => {
    setSuggestions((prev) =>
      prev.map((s) => (s.status === "pending" ? { ...s, status: "accepted" } : s)),
    );
  }, []);

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;

  return {
    suggestions,
    clusters,
    pendingCount,
    onAccept,
    onDismiss,
    onDefer,
    onAcceptAll,
  };
}
