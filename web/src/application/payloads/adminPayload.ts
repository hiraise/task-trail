import type { NewMailSettings } from "@/domain/repositories/AdminRepository";
import type { UserId } from "@/domain/types";

export interface UpdateServiceUrlPayload {
  serviceUrl: string;
}

/** Поля `password` нет — остаётся сохранённый пароль, null — удалить (NewMailSettings) */
export type SaveMailSettingsPayload = NewMailSettings;

export interface ChangeServiceAdminPayload {
  userId: UserId;
  isAdmin: boolean;
}

export interface PasswordResetLinkPayload {
  userId: UserId;
}
