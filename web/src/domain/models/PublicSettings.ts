/** Service settings the web knows before sign-in (ADR-0017). */
export interface PublicSettings {
  /** No users yet: the first account can be created, and it becomes the administrator (ADR-0016) */
  registrationOpen: boolean;
  /** Mail is configured: password recovery by email works */
  mailEnabled: boolean;
}
