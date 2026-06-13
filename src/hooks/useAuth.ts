import { useState, useEffect, useCallback } from "react";
import type { UserProfile, AuthProvider } from "../core/auth";
import * as commands from "../adapters/tauri/commands";

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
        if (!cancelled)
          setState({ user: profile, isLoading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({ user: null, isLoading: false, error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setUser = useCallback((user: UserProfile) => {
    setState({ user, isLoading: false, error: null });
  }, []);

  const setError = useCallback((error: string) => {
    setState((s) => ({ ...s, isLoading: false, error }));
  }, []);

  const startLoading = useCallback(() => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
  }, []);

  // ── OAuth ────────────────────────────────────────────────

  const signIn = useCallback(
    async (provider: AuthProvider, clientId: string, clientSecret: string) => {
      startLoading();
      try {
        const profile = await commands.signIn(provider, clientId, clientSecret);
        setUser(profile);
      } catch (err) {
        setError(String(err));
      }
    },
    [startLoading, setUser, setError],
  );

  // ── Local password ───────────────────────────────────────

  const signUp = useCallback(
    async (username: string, email: string | null, password: string) => {
      startLoading();
      try {
        const profile = await commands.signUpLocal(username, email, password);
        setUser(profile);
      } catch (err) {
        setError(String(err));
      }
    },
    [startLoading, setUser, setError],
  );

  const signInLocal = useCallback(
    async (username: string, password: string, totpCode?: string) => {
      startLoading();
      try {
        const profile = await commands.signInLocal(
          username,
          password,
          totpCode ?? null,
        );
        setUser(profile);
      } catch (err) {
        const msg = String(err);
        if (msg.includes("2FA_REQUIRED")) {
          setState((s) => ({
            ...s,
            isLoading: false,
            needs2FA: true,
            pendingUsername: username,
            pendingPassword: password,
          }));
          return;
        }
        setError(msg);
      }
    },
    [startLoading, setUser, setError],
  );

  // ── Mock login ───────────────────────────────────────────

  const mockLogin = useCallback(async () => {
    startLoading();
    try {
      const profile = await commands.mockLogin();
      setUser(profile);
    } catch (err) {
      setError(String(err));
    }
  }, [startLoading, setUser, setError]);

  // ── Passkey ──────────────────────────────────────────────

  const passkeyLogin = useCallback(async () => {
    startLoading();
    try {
      if (!window.PublicKeyCredential) {
        setError("Passkeys are not supported in this environment");
        return;
      }

      const challenge = await commands.webauthnAuthChallenge();

      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(atob(challenge.challenge), (c) =>
            c.charCodeAt(0),
          ),
          rpId: "localhost",
          userVerification: "preferred",
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        setError("Passkey authentication cancelled");
        return;
      }

      const profile = await commands.webauthnAuthVerify(credential.id);
      setUser(profile);
    } catch (err) {
      setError(String(err));
    }
  }, [startLoading, setUser, setError]);

  const registerPasskey = useCallback(async () => {
    startLoading();
    try {
      if (!window.PublicKeyCredential) {
        setError("Passkeys are not supported in this environment");
        return;
      }

      const challenge = await commands.webauthnRegisterChallenge();

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from(atob(challenge.challenge), (c) =>
            c.charCodeAt(0),
          ),
          rp: { name: "Project Ara", id: "localhost" },
          user: {
            id: Uint8Array.from(challenge.user_id, (c) => c.charCodeAt(0)),
            name: state.user?.name ?? "",
            displayName: state.user?.name ?? "",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 }, // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            userVerification: "preferred",
            residentKey: "preferred",
          },
          attestation: "none",
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        setError("Passkey registration cancelled");
        return;
      }

      await commands.webauthnRegisterVerify(credential.id, "stored");
      setState((s) => ({ ...s, isLoading: false, error: null }));
    } catch (err) {
      setError(String(err));
    }
  }, [startLoading, setUser, setError]);

  // ── Sign out ─────────────────────────────────────────────

  const signOut = useCallback(async () => {
    startLoading();
    try {
      await commands.signOut();
      setState({ user: null, isLoading: false, error: null });
    } catch (err) {
      setError(String(err));
    }
  }, [startLoading, setError]);

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: state.user !== null,
    signIn,
    signUp,
    signInLocal,
    mockLogin,
    passkeyLogin,
    registerPasskey,
    signOut,
  };
}
