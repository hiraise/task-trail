/**
 * A password reset link the administrator hands to the user directly — needed when mail
 * is not configured (ADR-0017). Works once.
 */
export interface PasswordResetLink {
  url: string;
  /** Valid until, ISO 8601 in UTC */
  expiresAt: string;
}
