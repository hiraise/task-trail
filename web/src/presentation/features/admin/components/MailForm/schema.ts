import z from "zod";

import type { MailSettings } from "@/domain/models/ServiceSettings";
import type { NewMailSettings } from "@/domain/repositories/AdminRepository";
import { adminTexts } from "@/shared/locales/admin";

const texts = adminTexts.mail;

// Пределы — как в MailSettingsRequest контракта; адрес отправителя проверяет сервер
export const schema = z.object({
  host: z.string().trim().min(1, texts.hostRequired),
  port: z
    .string()
    .trim()
    .regex(/^\d{1,5}$/, texts.portInvalid)
    .refine((value) => Number(value) >= 1 && Number(value) <= 65535, texts.portInvalid),
  encryption: z.enum(["none", "starttls", "tls"]),
  sender: z.string().trim().min(1, texts.senderRequired),
  username: z.string().trim(),
  password: z.string(),
});

export type FormValues = z.infer<typeof schema>;

export const toFormValues = (mail?: MailSettings): FormValues => ({
  host: mail?.host ?? "",
  port: mail ? String(mail.port) : "",
  encryption: mail?.encryption ?? "starttls",
  sender: mail?.sender ?? "",
  username: mail?.username ?? "",
  password: "",
});

/**
 * Пустой пароль — поля `password` в запросе нет: сервер оставит сохранённый (ADR-0015). Без логина
 * входа на SMTP нет, и пароль сервер не хранит.
 */
export const toNewMailSettings = (values: FormValues): NewMailSettings => ({
  host: values.host,
  port: Number(values.port),
  encryption: values.encryption,
  sender: values.sender,
  username: values.username || null,
  ...(values.username && values.password ? { password: values.password } : {}),
});
