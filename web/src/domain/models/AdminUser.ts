import type { User } from "./User";

/** Пользователь в разделе администратора: все пользователи сервиса (ADR-0014). */
export interface AdminUser extends User {
  /** Администратор сервиса */
  isAdmin: boolean;
  /** Дата регистрации, ISO 8601 в UTC */
  createdAt: string;
}
