/** SMTP connection encryption (ADR-0017): none, STARTTLS or TLS. */
export type MailEncryption = "none" | "starttls" | "tls";

/** Saved SMTP settings. The API never returns the password itself, only a flag that it is set (ADR-0015). */
export interface MailSettings {
  host: string;
  port: number;
  encryption: MailEncryption;
  /** Sender, for example `TaskTrail <noreply@example.com>` */
  sender: string;
  /** undefined when SMTP has no login */
  username?: string;
  /** The password is saved */
  passwordSet: boolean;
}

/** Service settings, for the service administrator only (ADR-0014, ADR-0015). */
export interface ServiceSettings {
  /** Web address with path, without a trailing `/`; links in emails and invitations are built from it */
  serviceUrl: string;
  /** undefined when mail is not configured */
  mail?: MailSettings;
}
