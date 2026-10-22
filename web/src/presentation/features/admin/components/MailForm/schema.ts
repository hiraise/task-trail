import z from "zod";

import type { MailSettings } from "@/domain/models/ServiceSettings";
import type { NewMailSettings } from "@/domain/repositories/AdminRepository";
import { adminTexts } from "@/shared/locales/admin";

const texts = adminTexts.mail;

// Limits as in MailSettingsRequest of the contract; the server checks the sender address
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
 * Empty password: no `password` field in the request, the server keeps the saved one (ADR-0015). Without a login
 * there is no SMTP auth, and the server does not store a password.
 */
export const toNewMailSettings = (values: FormValues): NewMailSettings => ({
  host: values.host,
  port: Number(values.port),
  encryption: values.encryption,
  sender: values.sender,
  username: values.username || null,
  ...(values.username && values.password ? { password: values.password } : {}),
});
