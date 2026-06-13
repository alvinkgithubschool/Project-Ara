import { useState, useCallback } from 'react';
import type { ProjectInfo } from '../core/project';
import * as commands from '../adapters/tauri/commands';

interface ProjectState {
  project: ProjectInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useProject() {
  const [state, setState] = useState<ProjectState>({
    project: null,
    isLoading: false,
    error: null,
  });

  const selectProject = useCallback(async (projectRoot: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const araDir = await commands.bootstrapProject(projectRoot);
      const name = projectRoot.split(/[/\\]/).pop() || 'Unnamed Project';
      const project: ProjectInfo = {
        rootPath: projectRoot,
        name,
        araDir,
        graphDbPath: `${araDir}/graph.db`,
      };
      setState({ project, isLoading: false, error: null });
      return project;
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: String(err) }));
      return null;
    }
  }, []);

  const clearProject = useCallback(() => {
    setState({ project: null, isLoading: false, error: null });
  }, []);

  return {
    project: state.project,
    isLoading: state.isLoading,
    error: state.error,
    selectProject,
    clearProject,
  };
}
