import { useState, useCallback } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = skipAuth;

  const skip = useCallback(() => setSkipAuth(true), []);
  const signOut = useCallback(async () => {
    setSkipAuth(false);
    try {
      const { createAuthClient } = await import("better-auth/react");
      const client = createAuthClient({ baseURL: "http://localhost:8787" });
      await client.signOut();
    } catch {
      // Server may not be running — that's ok
    }
  }, []);

  const getClient = useCallback(async () => {
    const { createAuthClient } = await import("better-auth/react");
    return createAuthClient({ baseURL: "http://localhost:8787" });
  }, []);

  return {
    user: isAuthenticated ? GUEST_USER : null,
    session: null,
    isLoading: false,
    error,
    isAuthenticated,

    signIn: {
      email: async (params: { email: string; password: string }) => {
        try {
          const client = await getClient();
          await client.signIn.email(params);
        } catch (e: any) {
          setError(
            e?.message || "Sign in failed — is the auth server running?",
          );
        }
      },
      social: async (params: { provider: string; callbackURL?: string }) => {
        try {
          const client = await getClient();
          await client.signIn.social(params);
        } catch (e: any) {
          setError(e?.message || "Social sign in failed");
        }
      },
    },
    signUp: {
      email: async (params: {
        name: string;
        email: string;
        password: string;
      }) => {
        try {
          const client = await getClient();
          await client.signUp.email(params);
        } catch (e: any) {
          setError(e?.message || "Sign up failed");
        }
      },
    },
    signOut,
    refresh: () => {},
    skipAuth: skip,
  };
}
