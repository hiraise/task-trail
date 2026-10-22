import type { UserId } from "../types";

export interface User {
  id: UserId;
  email: string;
  username: string | null;
  /** Avatar image URL; undefined when there is no avatar */
  avatarUrl?: string;
}

/** The current user: the one signed in to the web. */
export interface CurrentUser extends User {
  /** Service administrator (ADR-0014) */
  isAdmin: boolean;
}

export const getUserDisplayName = (user: User): string => {
  return user.username?.trim() || user.email.split("@")[0] || "";
};
