import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import type { AuthProvider, AuthTab } from "../../core/auth";

const TABS: { key: AuthTab; label: string }[] = [
  { key: "oauth", label: "OAuth" },
  { key: "password", label: "Password" },
  { key: "passkey", label: "Passkey" },
  { key: "signup", label: "Sign Up" },
];

/**
 * Sign-in screen with tabs for:
 *   - OAuth (GitHub / Google)
 *   - Password (username + password + optional 2FA)
 *   - Passkey (WebAuthn platform authenticator)
 *   - Sign Up (create a local account)
 *   - Mock login (dev only)
 */
export function SignIn() {
  const {
    signIn: signInOAuth,
    signInLocal,
    signUp,
    mockLogin,
    passkeyLogin,
    isLoading,
    error,
  } = useAuth();

  const [tab, setTab] = useState<AuthTab>("oauth");

  // OAuth state
  const [githubId, setGithubId] = useState("");
  const [githubSecret, setGithubSecret] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [googleSecret, setGoogleSecret] = useState("");
  const [showOAuthConfig, setShowOAuthConfig] = useState(false);

  // Password state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");

  // Sign up state
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");

  // Passkey state
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const handleOAuth = async (provider: AuthProvider) => {
    const clientId = provider === "github" ? githubId : googleId;
    const clientSecret = provider === "github" ? githubSecret : googleSecret;
    if (!clientId || !clientSecret) {
      setShowOAuthConfig(true);
      return;
    }
    await signInOAuth(provider, clientId, clientSecret);
  };

  const handlePasswordLogin = async () => {
    if (!username || !password) return;
    await signInLocal(username, password, totpCode || undefined);
  };

  const handleSignUp = async () => {
    if (!signUpUsername || !signUpPassword) return;
    if (signUpPassword !== signUpConfirm) return;
    await signUp(signUpUsername, signUpEmail || null, signUpPassword);
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    try {
      await passkeyLogin();
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Project Ara</h1>
        <p style={styles.subtitle}>Sign in to continue</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              style={{
                ...styles.tab,
                ...(tab === t.key ? styles.tabActive : {}),
              }}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {/* ── OAuth tab ──────────────────────────────── */}
        {tab === "oauth" && (
          <div style={styles.tabContent}>
            <button
              style={styles.button}
              onClick={() => handleOAuth("github")}
              disabled={isLoading}
            >
              Sign in with GitHub
            </button>
            <button
              style={styles.button}
              onClick={() => handleOAuth("google")}
              disabled={isLoading}
            >
              Sign in with Google
            </button>
            <button
              style={styles.configToggle}
              onClick={() => setShowOAuthConfig(!showOAuthConfig)}
            >
              {showOAuthConfig ? "Hide" : "Configure"} OAuth credentials
            </button>
            {showOAuthConfig && (
              <div style={styles.configSection}>
                <OAuthField
                  label="GitHub Client ID"
                  value={githubId}
                  onChange={setGithubId}
                  placeholder="Iv1.xxxx"
                />
                <OAuthField
                  label="GitHub Client Secret"
                  value={githubSecret}
                  onChange={setGithubSecret}
                  placeholder="••••••••"
                  secret
                />
                <OAuthField
                  label="Google Client ID"
                  value={googleId}
                  onChange={setGoogleId}
                  placeholder="xxxx.apps.googleusercontent.com"
                />
                <OAuthField
                  label="Google Client Secret"
                  value={googleSecret}
                  onChange={setGoogleSecret}
                  placeholder="••••••••"
                  secret
                />
              </div>
            )}
          </div>
        )}

        {/* ── Password tab ───────────────────────────── */}
        {tab === "password" && (
          <div style={styles.tabContent}>
            <Input
              label="Username"
              value={username}
              onChange={setUsername}
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <Input
              label="2FA Code (if enabled)"
              value={totpCode}
              onChange={setTotpCode}
              placeholder="123456"
              autoComplete="one-time-code"
            />
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handlePasswordLogin}
              disabled={isLoading || !username || !password}
            >
              Sign In
            </button>
          </div>
        )}

        {/* ── Passkey tab ────────────────────────────── */}
        {tab === "passkey" && (
          <div style={styles.tabContent}>
            <p style={styles.hint}>
              Use your device's built-in authenticator (Touch ID, Windows Hello,
              etc.) to sign in.
            </p>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
            >
              {passkeyLoading
                ? "Waiting for authenticator…"
                : "Sign in with Passkey"}
            </button>
          </div>
        )}

        {/* ── Sign Up tab ────────────────────────────── */}
        {tab === "signup" && (
          <div style={styles.tabContent}>
            <Input
              label="Username"
              value={signUpUsername}
              onChange={setSignUpUsername}
              autoComplete="username"
            />
            <Input
              label="Email (optional)"
              type="email"
              value={signUpEmail}
              onChange={setSignUpEmail}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={signUpPassword}
              onChange={setSignUpPassword}
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={signUpConfirm}
              onChange={setSignUpConfirm}
              autoComplete="new-password"
            />
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleSignUp}
              disabled={
                isLoading ||
                !signUpUsername ||
                !signUpPassword ||
                signUpPassword !== signUpConfirm
              }
            >
              Create Account
            </button>
          </div>
        )}

        {/* ── Mock login (dev only) ──────────────────── */}
        <div style={styles.mockSection}>
          <div style={styles.divider} />
          <button
            style={styles.mockButton}
            onClick={mockLogin}
            disabled={isLoading}
          >
            Mock Login (dev)
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function OAuthField({
  label,
  value,
  onChange,
  placeholder,
  secret,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret?: boolean;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        type={secret ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100vw",
    backgroundColor: "var(--color-bg)",
    overflow: "auto",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--space-5)",
    padding: "var(--space-10) var(--space-6)",
    maxWidth: 420,
    width: "100%",
  },
  title: {
    fontSize: "var(--text-3xl)",
    fontWeight: "var(--font-bold)",
    letterSpacing: "var(--tracking-tight)",
  },
  subtitle: {
    color: "var(--color-text-secondary)",
    fontSize: "var(--text-base)",
  },
  tabs: {
    display: "flex",
    gap: 0,
    width: "100%",
    borderBottom: "1px solid var(--color-border)",
  },
  tab: {
    flex: 1,
    padding: "var(--space-2) var(--space-3)",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-medium)",
    color: "var(--color-text-tertiary)",
    cursor: "pointer",
    transition:
      "color var(--transition-fast), border-color var(--transition-fast)",
  },
  tabActive: {
    color: "var(--color-text)",
    borderBottomColor: "var(--color-text)",
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
    width: "100%",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-1)",
  },
  label: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--font-medium)",
    color: "var(--color-text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wide)",
  },
  input: {
    padding: "var(--space-2) var(--space-3)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-mono)",
  },
  button: {
    width: "100%",
    padding: "var(--space-3) var(--space-4)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--text-base)",
    fontWeight: "var(--font-medium)",
    cursor: "pointer",
    transition: "background-color var(--transition-fast)",
  },
  primaryButton: {
    backgroundColor: "var(--color-accent)",
    color: "var(--color-text-inverse)",
    border: "none",
  },
  configToggle: {
    background: "none",
    border: "none",
    color: "var(--color-text-tertiary)",
    fontSize: "var(--text-sm)",
    textDecoration: "underline",
    cursor: "pointer",
  },
  configSection: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
    width: "100%",
    padding: "var(--space-4)",
    backgroundColor: "var(--color-bg-secondary)",
    borderRadius: "var(--radius-md)",
  },
  hint: {
    color: "var(--color-text-secondary)",
    fontSize: "var(--text-sm)",
    textAlign: "center",
    lineHeight: "var(--leading-relaxed)",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "var(--color-border-light)",
    margin: "var(--space-2) 0",
  },
  mockSection: {
    width: "100%",
  },
  mockButton: {
    width: "100%",
    padding: "var(--space-2) var(--space-3)",
    backgroundColor: "transparent",
    color: "var(--color-text-tertiary)",
    border: "1px dashed var(--color-border)",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-xs)",
    cursor: "pointer",
  },
  error: {
    color: "var(--color-error)",
    fontSize: "var(--text-sm)",
    padding: "var(--space-2) var(--space-3)",
    backgroundColor: "var(--color-bg-secondary)",
    borderRadius: "var(--radius-sm)",
    width: "100%",
    textAlign: "center",
  },
};
