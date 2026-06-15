import { createAuthClient } from "better-auth/react";
import { useState, useCallback } from "react";

const authClient = createAuthClient({
  baseURL: "http://localhost:8787",
});

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
  const session = authClient.useSession();

  const isPending = !skipAuth && session.isPending;
  const isAuthenticated = skipAuth || session.data?.user != null;

  const user = skipAuth ? GUEST_USER : (session.data?.user ?? null);

  const skip = useCallback(() => setSkipAuth(true), []);

  const signOut = useCallback(async () => {
    setSkipAuth(false);
    await authClient.signOut();
    session.refetch();
  }, [session]);

  return {
    user,
    session: session.data ?? null,
    isLoading: isPending,
    error: session.error
      ? String(session.error.message || session.error)
      : null,
    isAuthenticated,

    signIn: {
      email: authClient.signIn.email,
      social: authClient.signIn.social,
    },
    signUp: {
      email: authClient.signUp.email,
    },
    signOut,
    refresh: () => session.refetch(),
    skipAuth: skip,
  };
}
