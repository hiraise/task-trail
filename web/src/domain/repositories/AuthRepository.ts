import type { Invitation } from "../models/Invitation";
import type { CurrentUser } from "../models/User";

export interface FirstAccountData {
  email: string;
  password: string;
  username: string;
  /** Web address with path: the server builds links in emails from it (ADR-0015) */
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
  /** The first account, which is also the service administrator; works while there are no users (ADR-0016) */
  registerFirstAccount(data: FirstAccountData): Promise<CurrentUser>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  lookupInvitation(token: string): Promise<Invitation>;
  /** Creates an account from an invitation and opens a session */
  acceptInvitation(data: AcceptInvitationData): Promise<CurrentUser>;
}
