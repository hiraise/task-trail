import type { AdminUser } from "../models/AdminUser";
import type { PasswordResetLink } from "../models/PasswordResetLink";
import type { MailEncryption, ServiceSettings } from "../models/ServiceSettings";
import type { UserId } from "../types";

/** Настройки SMTP, которые сохраняет администратор: заменяют прежние целиком. */
export interface NewMailSettings {
  host: string;
  port: number;
  encryption: MailEncryption;
  /** Адрес почты, можно с именем: `TaskTrail <noreply@example.com>` */
  sender: string;
  /** null — без входа на SMTP; тогда пароль не нужен и не сохраняется */
  username: string | null;
  /**
   * Три разных случая — не своди их к одному:
   * - поля нет (или undefined) — остаётся сохранённый пароль, если сервер и порт прежние,
   *   иначе сервер ответит `SECRET_REQUIRED` (ADR-0015);
   * - строка — новый пароль;
   * - null — удалить сохранённый пароль.
   */
  password?: string | null;
}

// Только администратору сервиса (ADR-0014); сервер отвечает изменённым ресурсом (ADR-0018).
export interface AdminRepository {
  getSettings(): Promise<ServiceSettings>;
  /** Сервер отбрасывает `/` в конце; ссылки, выданные раньше, ведут на прежний адрес */
  updateServiceUrl(serviceUrl: string): Promise<ServiceSettings>;
  /**
   * Подключает почту или меняет её настройки. Сервер сначала проверяет подключение к SMTP —
   * до 10 секунд; не вышло — `MAIL_CONNECTION_FAILED`, настройки не сохранены (ADR-0017)
   */
  saveMail(settings: NewMailSettings): Promise<ServiceSettings>;
  /** Настройки SMTP и пароль удаляются */
  disableMail(): Promise<void>;
  /** Тестовое письмо на почту администратора; без почты — `MAIL_DISABLED` */
  sendTestMail(): Promise<void>;
  /** Все пользователи сервиса по дате регистрации, первые — раньше */
  findUsers(): Promise<AdminUser[]>;
  /** Последнего администратора снять нельзя — `LAST_ADMIN` */
  setAdmin(userId: UserId, isAdmin: boolean): Promise<AdminUser>;
  createPasswordResetLink(userId: UserId): Promise<PasswordResetLink>;
}
