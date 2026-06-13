import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

type AuthTab = "password" | "signup" | "passkey";

const TABS: { key: AuthTab; label: string }[] = [
  { key: "password", label: "Sign In" },
  { key: "signup", label: "Sign Up" },
  { key: "passkey", label: "Passkey" },
];

export function SignIn() {
  const { signIn, signUp, isLoading, error } = useAuth();
  const [tab, setTab] = useState<AuthTab>("password");

  // Password sign-in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");

  // Sign up
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // OAuth loading
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleEmailSignIn = async () => {
    if (!email || !password) return;
    await signIn.email({
      email,
      password,
      callbackURL: "/",
    });
  };

  const handleSignUp = async () => {
    if (!regEmail || !regPassword || regPassword !== regConfirm) return;
    await signUp.email({
      name: regName,
      email: regEmail,
      password: regPassword,
      callbackURL: "/",
    });
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setSocialLoading(provider);
    try {
      await signIn.social({
        provider,
        callbackURL: "/",
      });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Project Ara</h1>
        <p style={styles.subtitle}>Sign in to continue</p>

        {error && <p style={styles.errorBanner}>{error}</p>}

        {/* Social sign-in buttons */}
        <div style={styles.socialButtons}>
          <button
            style={styles.socialButton}
            onClick={() => handleSocialSignIn("github")}
            disabled={isLoading || socialLoading !== null}
          >
            {socialLoading === "github" ? "Connecting…" : "GitHub"}
          </button>
          <button
            style={styles.socialButton}
            onClick={() => handleSocialSignIn("google")}
            disabled={isLoading || socialLoading !== null}
          >
            {socialLoading === "google" ? "Connecting…" : "Google"}
          </button>
        </div>

        <div style={styles.dividerContainer}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

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

        {/* Password sign-in */}
        {tab === "password" && (
          <div style={styles.tabContent}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
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
              style={{ ...styles.primaryButton }}
              onClick={handleEmailSignIn}
              disabled={isLoading || !email || !password}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Sign Up */}
        {tab === "signup" && (
          <div style={styles.tabContent}>
            <Input
              label="Name"
              value={regName}
              onChange={setRegName}
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              value={regEmail}
              onChange={setRegEmail}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={regPassword}
              onChange={setRegPassword}
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password"
              type="password"
              value={regConfirm}
              onChange={setRegConfirm}
              autoComplete="new-password"
            />
            <button
              style={{ ...styles.primaryButton }}
              onClick={handleSignUp}
              disabled={
                isLoading ||
                !regEmail ||
                !regPassword ||
                regPassword !== regConfirm
              }
            >
              Create Account
            </button>
          </div>
        )}

        {/* Passkey */}
        {tab === "passkey" && (
          <div style={styles.tabContent}>
            <p style={styles.hint}>
              Use your device's built-in authenticator (Touch ID, Windows Hello)
              to sign in or register a passkey.
            </p>
            <button
              style={{ ...styles.primaryButton }}
              onClick={() =>
                signIn.social({ provider: "passkey", callbackURL: "/" })
              }
              disabled={isLoading}
            >
              Sign in with Passkey
            </button>
          </div>
        )}
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
      <label style={styles.fieldLabel}>{label}</label>
      <input
        style={styles.fieldInput}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
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
  socialButtons: {
    display: "flex",
    gap: "var(--space-3)",
    width: "100%",
  },
  socialButton: {
    flex: 1,
    padding: "var(--space-3) var(--space-4)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-medium)",
    cursor: "pointer",
    transition: "background-color var(--transition-fast)",
  },
  dividerContainer: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "var(--color-border-light)",
  },
  dividerText: {
    fontSize: "var(--text-xs)",
    color: "var(--color-text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wide)",
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
  fieldLabel: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--font-medium)",
    color: "var(--color-text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "var(--tracking-wide)",
  },
  fieldInput: {
    padding: "var(--space-2) var(--space-3)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-mono)",
  },
  primaryButton: {
    width: "100%",
    padding: "var(--space-3) var(--space-4)",
    backgroundColor: "var(--color-accent)",
    color: "var(--color-text-inverse)",
    border: "none",
    borderRadius: "var(--radius-md)",
    fontSize: "var(--text-base)",
    fontWeight: "var(--font-medium)",
    cursor: "pointer",
    transition: "opacity var(--transition-fast)",
  },
  hint: {
    color: "var(--color-text-secondary)",
    fontSize: "var(--text-sm)",
    textAlign: "center",
    lineHeight: "var(--leading-relaxed)",
  },
  errorBanner: {
    color: "var(--color-error)",
    fontSize: "var(--text-sm)",
    padding: "var(--space-2) var(--space-3)",
    backgroundColor: "var(--color-bg-secondary)",
    borderRadius: "var(--radius-sm)",
    width: "100%",
    textAlign: "center",
  },
};
