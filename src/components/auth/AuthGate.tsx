import { useAuth } from '../../hooks/useAuth';
import { SignIn } from './SignIn';
import { UserMenu } from './UserMenu';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * AuthGate wraps the app. If the user is not authenticated, shows SignIn.
 * If authenticated, shows children with a UserMenu in the corner.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.userMenuBar}>
        <UserMenu />
      </div>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
  },
  wrapper: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  userMenuBar: {
    position: 'absolute',
    top: 'var(--space-4)',
    right: 'var(--space-4)',
    zIndex: 100,
  },
};
