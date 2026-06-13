import { useState, useCallback, useEffect, useRef } from "react";
import { createAuthClient } from "better-auth/react";

/** Lazy Better Auth client — only created when user opts into auth. */
let _authClient: ReturnType<typeof createAuthClient> | null = null;

function getAuthClient() {
  if (!_authClient) {
    _authClient = createAuthClient({
      baseURL: "http://localhost:8787",
    });
  }
  return _authClient;
}

/** Mock user for guest/dev access. */
const GUEST_USER = {
  id: "guest",
  name: "Guest",
  email: "guest@local",
  image: null,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function useAuth() {
  const [skipAuth, setSkipAuth] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const authClient = useRef(getAuthClient());

  // Only check session if not skipping auth and user hasn't explicitly signed out
  useEffect(() => {
    if (skipAuth) return;

    let cancelled = false;
    setSessionLoading(true);

    authClient.current
      .getSession()
      .then((res: any) => {
        if (!cancelled) {
          setSessionData(res.data ?? null);
          setSessionError(
            res.error ? String(res.error.message || res.error) : null,
          );
          setSessionLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setSessionError(String(err.message || err));
          setSessionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [skipAuth]);

  const isAuthenticated =
    skipAuth || (sessionData !== null && sessionData !== undefined);

  const skip = useCallback(() => setSkipAuth(true), []);

  const signOut = useCallback(async () => {
    setSkipAuth(false);
    try {
      await authClient.current.signOut();
    } catch {
      /* ignore */
    }
    setSessionData(null);
  }, []);

  return {
    user: skipAuth ? GUEST_USER : (sessionData?.user ?? null),
    session: sessionData,
    isLoading: sessionLoading,
    error: sessionError,
    isAuthenticated,

    signIn: {
      email: authClient.current.signIn.email,
      social: authClient.current.signIn.social,
    },
    signUp: {
      email: authClient.current.signUp.email,
    },
    signOut,
    refresh: async () => {
      try {
        const res = await authClient.current.getSession();
        setSessionData((res as any).data ?? null);
      } catch {
        /* ignore */
      }
    },
    skipAuth: skip,
  };
}
