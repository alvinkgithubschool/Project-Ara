import { useState, useCallback } from "react";
import { authClient } from "../lib/auth-client";

const { useSession, signIn, signUp, signOut } = authClient;

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
  const session = useSession();
  const [skipAuth, setSkipAuth] = useState(false);

  const isAuthenticated =
    skipAuth || (session.data !== null && session.data !== undefined);
  const user = skipAuth ? GUEST_USER : (session.data?.user ?? null);

  const skip = useCallback(() => {
    setSkipAuth(true);
  }, []);

  return {
    user,
    session: skipAuth ? null : (session.data ?? null),
    isLoading: session.isPending,
    error: session.error ? String(session.error) : null,
    isAuthenticated,

    signIn: {
      email: signIn.email,
      social: signIn.social,
    },
    signUp: {
      email: signUp.email,
    },
    signOut: async () => {
      setSkipAuth(false);
      if (!skipAuth) {
        await signOut();
      }
      session.refetch();
    },
    refresh: () => session.refetch(),
    skipAuth: skip,
  };
}
