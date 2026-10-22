import type { UserId } from "../types";

export interface User {
  id: UserId;
  email: string;
  username: string | null;
  /** Адрес картинки аватарки; аватарки нет — undefined */
  avatarUrl?: string;
}

/** Текущий пользователь: вошедший в веб. */
export interface CurrentUser extends User {
  /** Администратор сервиса (ADR-0014) */
  isAdmin: boolean;
}

export const getUserDisplayName = (user: User): string => {
  return user.username?.trim() || user.email.split("@")[0] || "";
};
