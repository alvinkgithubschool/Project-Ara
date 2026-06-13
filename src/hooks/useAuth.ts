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
  const signOut = useCallback(() => setSkipAuth(false), []);

  return {
    user: isAuthenticated ? GUEST_USER : null,
    session: null,
    isLoading: false,
    error,
    isAuthenticated,

    signIn: {
      email: (_params: any) => {
        setError(
          "Auth server not running. Use 'Continue without account' or start: cd server && node index.js",
        );
      },
      social: (_params: any) => {
        setError(
          "Auth server not running. Use 'Continue without account' or start: cd server && node index.js",
        );
      },
    },
    signUp: {
      email: (_params: any) => {
        setError(
          "Auth server not running. Use 'Continue without account' or start: cd server && node index.js",
        );
      },
    },
    signOut,
    refresh: () => {},
    skipAuth: skip,
  };
}
