/** Auth-related types — mirrors the Rust `auth` module. */

export type AuthProvider = 'github' | 'google';

export interface UserProfile {
  provider: string;
  provider_id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
}
