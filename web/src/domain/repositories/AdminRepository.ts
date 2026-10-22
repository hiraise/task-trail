import type { AdminUser } from "../models/AdminUser";
import type { PasswordResetLink } from "../models/PasswordResetLink";
import type { MailEncryption, ServiceSettings } from "../models/ServiceSettings";
import type { UserId } from "../types";

/** SMTP settings saved by the administrator: they replace the previous ones entirely. */
export interface NewMailSettings {
  host: string;
  port: number;
  encryption: MailEncryption;
  /** Email address, optionally with a name: `TaskTrail <noreply@example.com>` */
  sender: string;
  /** null means no SMTP login; then no password is needed or saved */
  username: string | null;
  /**
   * Three distinct cases — do not merge them into one:
   * - no field (or undefined): the saved password is kept if the host and port are unchanged,
   *   otherwise the server responds `SECRET_REQUIRED` (ADR-0015);
   * - a string: a new password;
   * - null: delete the saved password.
   */
  password?: string | null;
}

// Service administrator only (ADR-0014); the server responds with the changed resource (ADR-0018).
export interface AdminRepository {
  getSettings(): Promise<ServiceSettings>;
  /** The server strips a trailing `/`; links issued earlier point to the old address */
  updateServiceUrl(serviceUrl: string): Promise<ServiceSettings>;
  /**
   * Enables mail or changes its settings. The server first checks the SMTP connection —
   * up to 10 seconds; on failure — `MAIL_CONNECTION_FAILED`, settings are not saved (ADR-0017)
   */
  saveMail(settings: NewMailSettings): Promise<ServiceSettings>;
  /** SMTP settings and the password are deleted */
  disableMail(): Promise<void>;
  /** Test email to the administrator's address; without mail — `MAIL_DISABLED` */
  sendTestMail(): Promise<void>;
  /** All service users by registration date, earliest first */
  findUsers(): Promise<AdminUser[]>;
  /** The last administrator cannot be demoted — `LAST_ADMIN` */
  setAdmin(userId: UserId, isAdmin: boolean): Promise<AdminUser>;
  createPasswordResetLink(userId: UserId): Promise<PasswordResetLink>;
}
