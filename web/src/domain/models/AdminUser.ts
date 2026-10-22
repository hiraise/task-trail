import type { User } from "./User";

/** A user in the admin section: all users of the service (ADR-0014). */
export interface AdminUser extends User {
  /** Service administrator */
  isAdmin: boolean;
  /** Registration date, ISO 8601 in UTC */
  createdAt: string;
}
