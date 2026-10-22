/** Шифрование соединения с SMTP (ADR-0017): нет, STARTTLS или TLS. */
export type MailEncryption = "none" | "starttls" | "tls";

/** Сохранённые настройки SMTP. Сам пароль API не отдаёт — только признак, что он есть (ADR-0015). */
export interface MailSettings {
  host: string;
  port: number;
  encryption: MailEncryption;
  /** Отправитель, например `TaskTrail <noreply@example.com>` */
  sender: string;
  /** Без входа на SMTP — undefined */
  username?: string;
  /** Пароль сохранён */
  passwordSet: boolean;
}

/** Настройки сервиса — только администратору сервиса (ADR-0014, ADR-0015). */
export interface ServiceSettings {
  /** Адрес веба с путём, без `/` в конце; от него строятся ссылки в письмах и приглашениях */
  serviceUrl: string;
  /** Почта не подключена — undefined */
  mail?: MailSettings;
}
