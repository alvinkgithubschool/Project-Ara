import { useState, useCallback } from "react";
import type { CanvasStateData, CanvasObjectData } from "../core/canvas";
import * as commands from "../adapters/tauri/commands";

/** Deterministic id for a project's root canvas. */
function rootCanvasId(projectId: string): string {
  return `${projectId}:root`;
}

export function useCanvas(projectId: string) {
  const [canvasStack, setCanvasStack] = useState<CanvasStateData[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<CanvasStateData | null>(null);

  const reload = useCallback(
    async (canvasId: string) => {
      const state = await commands.loadCanvasState(projectId, canvasId);
      setCurrentCanvas(state);
      return state;
    },
    [projectId],
  );

  /** Ensure the project's root canvas exists, then make it current. */
  const ensureRootCanvas = useCallback(async () => {
    const id = rootCanvasId(projectId);
    let state: CanvasStateData;
    try {
      state = await commands.loadCanvasState(projectId, id);
    } catch {
      // Root canvas not created yet — seed it.
      await commands.upsertCanvasState({
        id,
        project_id: projectId,
        parent_canvas_id: null,
        label: "Canvas",
        viewport_x: 0,
        viewport_y: 0,
        viewport_zoom: 1,
        objects: [],
      });
      state = await commands.loadCanvasState(projectId, id);
    }
    setCurrentCanvas(state);
    setCanvasStack([state]);
    return state;
  }, [projectId]);

  const navigate = useCallback(
    async (canvasId: string) => {
      const state = await commands.loadCanvasState(projectId, canvasId);
      setCurrentCanvas(state);
      setCanvasStack((prev) => [...prev, state]);
    },
    [projectId],
  );

  const goBack = useCallback(() => {
    setCanvasStack((prev) => {
      const next = prev.slice(0, -1);
      setCurrentCanvas(next[next.length - 1] || null);
      return next;
    });
  }, []);

  const navigateTo = useCallback(
    (canvasId: string) => {
      setCanvasStack((prev) => {
        const idx = prev.findIndex((c) => c.id === canvasId);
        if (idx === -1) return prev;
        const next = prev.slice(0, idx + 1);
        setCurrentCanvas(next[next.length - 1] || null);
        return next;
      });
    },
    [],
  );

  const createNote = useCallback(
    async (x: number, y: number) => {
      if (!currentCanvas) return;
      const obj: CanvasObjectData = {
        id: crypto.randomUUID(),
        canvas_id: currentCanvas.id,
        project_id: projectId,
        object_type: "note",
        position_x: x,
        position_y: y,
        width: 240,
        height: 160,
        z_index: Date.now(),
        data: { title: "", body: "", colorTag: "#00d4ff" },
      };
      await commands.upsertCanvasObject(obj);
      await reload(currentCanvas.id);
    },
    [currentCanvas, projectId, reload],
  );

  /** Persist edits to a note's title/body (wired into NoteNode.onPersist). */
  const persistNote = useCallback(
    async (objectId: string, patch: { title: string; body: string }) => {
      if (!currentCanvas) return;
      const existing = currentCanvas.objects.find((o) => o.id === objectId);
      if (!existing) return;
      await commands.upsertCanvasObject({
        ...existing,
        data: { ...existing.data, ...patch },
      });
      await reload(currentCanvas.id);
    },
    [currentCanvas, reload],
  );

  return {
    currentCanvas,
    canvasStack,
    ensureRootCanvas,
    navigate,
    navigateTo,
    goBack,
    createNote,
    persistNote,
    reload,
  };
}
