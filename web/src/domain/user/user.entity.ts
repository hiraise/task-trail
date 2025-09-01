export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface BaseUserData {
  email: string;
}
export interface UserData extends BaseUserData {
  username?: string;
  avatarUrl?: string;
}

export interface MembersData extends BaseUserData {
  id: number;
  username?: string;
  avatarUrl?: string;
}
