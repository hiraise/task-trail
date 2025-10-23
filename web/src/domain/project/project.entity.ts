export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  tasksCount: number;
  permissions: PermissionType[];
}

export interface ProjectMember {
  email: string;
  id: number;
  permissions: PermissionType[];
  username: string;
  isOwner?: boolean;
  isAdmin?: boolean;
}

export const PERMISSIONS = {
  PROJECT_INVITE_USERS: "PROJECT_INVITE_USERS",
  PROJECT_KICK_USERS: "PROJECT_KICK_USERS",
  PROJECT_SET_ROLES: "PROJECT_SET_ROLES",
  PROJECT_EDIT: "PROJECT_EDIT",
  PROJECT_ARCHIVE: "PROJECT_ARCHIVE",
  PROJECT_DELETE: "PROJECT_DELETE",
  PROJECT_DELETE_TASK: "PROJECT_DELETE_TASK",
  PROJECT_GET_CANDIDATES: "PROJECT_GET_CANDIDATES",
  PROJECT_OWNER: "PROJECT_OWNER",
  PROJECT_ADMIN: "PROJECT_ADMIN",
  PROJECT_UPDATE_TASK: "PROJECT_UPDATE_TASK",
};

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
