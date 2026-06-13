import { authClient } from "../lib/auth-client";

const { useSession, signIn, signUp, signOut } = authClient;

export function useAuth() {
  const session = useSession();

  return {
    user: session.data?.user ?? null,
    session: session.data ?? null,
    isLoading: session.isPending,
    error: session.error ? String(session.error) : null,
    isAuthenticated: session.data !== null && session.data !== undefined,

    signIn: {
      email: signIn.email,
      social: signIn.social,
    },
    signUp: {
      email: signUp.email,
    },
    signOut: async () => {
      await signOut();
      session.refetch();
    },
    refresh: () => session.refetch(),
  };
}
