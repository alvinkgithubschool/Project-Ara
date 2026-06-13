import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { AuthProvider } from '../../core/auth';

/**
 * Sign-in screen with GitHub and Google OAuth buttons.
 * Client ID/Secret are provided through input fields for local development.
 */
export function SignIn() {
  const { signIn, isLoading, error } = useAuth();
  const [githubId, setGithubId] = useState('');
  const [githubSecret, setGithubSecret] = useState('');
  const [googleId, setGoogleId] = useState('');
  const [googleSecret, setGoogleSecret] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleSignIn = async (provider: AuthProvider) => {
    const clientId = provider === 'github' ? githubId : googleId;
    const clientSecret = provider === 'github' ? githubSecret : googleSecret;
    if (!clientId || !clientSecret) {
      setShowConfig(true);
      return;
    }
    await signIn(provider, clientId, clientSecret);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Project Ara</h1>
        <p style={styles.subtitle}>Sign in to continue</p>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.buttons}>
          <button
            style={styles.button}
            onClick={() => handleSignIn('github')}
            disabled={isLoading}
          >
            <span style={styles.icon}>⬡</span>
            Sign in with GitHub
          </button>

          <button
            style={styles.button}
            onClick={() => handleSignIn('google')}
            disabled={isLoading}
          >
            <span style={styles.icon}>G</span>
            Sign in with Google
          </button>
        </div>

        <button
          style={styles.configToggle}
          onClick={() => setShowConfig(!showConfig)}
        >
          {showConfig ? 'Hide' : 'Configure'} OAuth credentials
        </button>

        {showConfig && (
          <div style={styles.configSection}>
            <div style={styles.configGroup}>
              <label style={styles.label}>GitHub Client ID</label>
              <input
                style={styles.input}
                type="text"
                value={githubId}
                onChange={(e) => setGithubId(e.target.value)}
                placeholder="Iv1.xxxx"
              />
              <label style={styles.label}>GitHub Client Secret</label>
              <input
                style={styles.input}
                type="password"
                value={githubSecret}
                onChange={(e) => setGithubSecret(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div style={styles.configGroup}>
              <label style={styles.label}>Google Client ID</label>
              <input
                style={styles.input}
                type="text"
                value={googleId}
                onChange={(e) => setGoogleId(e.target.value)}
                placeholder="xxxx.apps.googleusercontent.com"
              />
              <label style={styles.label}>Google Client Secret</label>
              <input
                style={styles.input}
                type="password"
                value={googleSecret}
                onChange={(e) => setGoogleSecret(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--color-bg)',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-6)',
    padding: 'var(--space-10)',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 'var(--font-bold)',
    letterSpacing: 'var(--tracking-tight)',
  },
  subtitle: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-base)',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    width: '100%',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-medium)',
    transition: 'background-color var(--transition-fast)',
  },
  icon: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-bold)',
  },
  configToggle: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-tertiary)',
    fontSize: 'var(--text-sm)',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  configSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    width: '100%',
    padding: 'var(--space-4)',
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: 'var(--radius-md)',
  },
  configGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  label: {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tracking-wide)',
  },
  input: {
    padding: 'var(--space-2) var(--space-3)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-mono)',
  },
  error: {
    color: 'var(--color-error)',
    fontSize: 'var(--text-sm)',
    padding: 'var(--space-2) var(--space-3)',
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: 'var(--radius-sm)',
    width: '100%',
    textAlign: 'center',
  },
};
