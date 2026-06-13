/** Auth-related types — mirrors the Rust `auth` module. */

export type AuthProvider = "github" | "google";

export interface UserProfile {
  provider: string;
  provider_id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
}

/** TOTP setup data from the backend. */
export interface TOTPSetup {
  secret: string;
  otpauth_url: string;
  qr_code_svg: string | null;
}

/** WebAuthn challenge from the backend. */
export interface WebAuthnChallenge {
  challenge: string;
  user_id: string;
}

/** Available auth tabs in the sign-in screen. */
export type AuthTab = "oauth" | "password" | "passkey" | "signup";
