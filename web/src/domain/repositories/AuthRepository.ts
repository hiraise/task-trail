import type { Invitation } from "../models/Invitation";
import type { CurrentUser } from "../models/User";

export interface FirstAccountData {
  email: string;
  password: string;
  username: string;
  /** Адрес веба с путём: от него сервер строит ссылки в письмах (ADR-0015) */
  serviceUrl: string;
}

export interface AcceptInvitationData {
  token: string;
  username: string;
  password: string;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<CurrentUser>;
  logout(): Promise<void>;
  /** Первый аккаунт, он же администратор сервиса; работает, пока пользователей нет (ADR-0016) */
  registerFirstAccount(data: FirstAccountData): Promise<CurrentUser>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  lookupInvitation(token: string): Promise<Invitation>;
  /** Создаёт аккаунт по приглашению и открывает сессию */
  acceptInvitation(data: AcceptInvitationData): Promise<CurrentUser>;
}
