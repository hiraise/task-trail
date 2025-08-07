export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  totalTasks: number;
  roles: RoleType[];
  permissions: PermissionType[];
}

export interface ProjectMember {
  email: string;
  id: number;
  roles: string[];
  username: string;
}

export interface ProjectPermissions {
  role: RoleType;
  permissions: PermissionType[];
}

export const PERMISSONS = {
  PROJECT_INVITE_USERS: "PROJECT_INVITE_USERS",
  PROJECT_KICK_USERS: "PROJECT_KICK_USERS",
  PROJECT_SET_ROLES: "PROJECT_SET_ROLES",
  PROJECT_EDIT: "PROJECT_EDIT",
  PROJECT_ARCHIVE: "PROJECT_ARCHIVE",
  PROJECT_DELETE: "PROJECT_DELETE",
  PROJECT_GET_CANDIDATES: "PROJECT_GET_CANDIDATES",
};

export const ROLES = {
  OWNER: "owner",
  MEMBER: "member",
  ADMIN: "admin",
};

export type PermissionType = (typeof PERMISSONS)[keyof typeof PERMISSONS];
export type RoleType = (typeof ROLES)[keyof typeof ROLES];
