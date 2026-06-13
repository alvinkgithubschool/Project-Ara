import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, AuthProvider } from '../core/auth';
import * as commands from '../adapters/tauri/commands';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;
    commands
      .restoreSession()
      .then((profile) => {
        if (!cancelled) {
          setState({ user: profile, isLoading: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ user: null, isLoading: false, error: String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (provider: AuthProvider, clientId: string, clientSecret: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const profile = await commands.signIn(provider, clientId, clientSecret);
        setState({ user: profile, isLoading: false, error: null });
      } catch (err) {
        setState((s) => ({ ...s, isLoading: false, error: String(err) }));
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      await commands.signOut();
      setState({ user: null, isLoading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: String(err) }));
    }
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: state.user !== null,
    signIn,
    signOut,
  };
}
