import { useAuth } from '../../hooks/useAuth';

/**
 * Compact user menu showing the current user and a sign-out button.
 */
export function UserMenu() {
  const { user, signOut, isLoading } = useAuth();

  if (!user) return null;

  return (
    <div style={styles.container}>
      {user.avatar_url && (
        <img
          src={user.avatar_url}
          alt={user.name}
          style={styles.avatar}
        />
      )}
      <span style={styles.name}>{user.name}</span>
      <button
        style={styles.signOutButton}
        onClick={signOut}
        disabled={isLoading}
        title="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-3)',
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-light)',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 'var(--radius-full)',
  },
  name: {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    color: 'var(--color-text)',
  },
  signOutButton: {
    padding: 'var(--space-1) var(--space-2)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    cursor: 'pointer',
  },
};
