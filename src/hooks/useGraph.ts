import { useState, useCallback } from 'react';
import type { GraphSnapshot, GraphNode } from '../core/graph';
import * as commands from '../adapters/tauri/commands';

interface GraphState {
  graph: GraphSnapshot | null;
  selectedNode: GraphNode | null;
  isLoading: boolean;
  error: string | null;
}

export function useGraph() {
  const [state, setState] = useState<GraphState>({
    graph: null,
    selectedNode: null,
    isLoading: false,
    error: null,
  });

  const scanAndLoad = useCallback(async (projectRoot: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const graph = await commands.scanProject(projectRoot);
      setState((s) => ({ ...s, graph, isLoading: false, selectedNode: null }));
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: String(err) }));
    }
  }, []);

  const loadGraph = useCallback(async (projectRoot: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const graph = await commands.getGraph(projectRoot);
      setState((s) => ({ ...s, graph, isLoading: false }));
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: String(err) }));
    }
  }, []);

  const selectNode = useCallback(async (projectRoot: string, nodeId: string) => {
    try {
      const node = await commands.getGraphNode(projectRoot, nodeId);
      setState((s) => ({ ...s, selectedNode: node }));
    } catch (err) {
      console.error('Failed to fetch node:', err);
    }
  }, []);

  return {
    graph: state.graph,
    selectedNode: state.selectedNode,
    isLoading: state.isLoading,
    error: state.error,
    scanAndLoad,
    loadGraph,
    selectNode,
  };
}
