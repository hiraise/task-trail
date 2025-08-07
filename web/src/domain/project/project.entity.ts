export interface Project {
  id: number;
  ownerId?: string;
  name: string;
  description?: string;
  totalTasks: number;
  rights: ProjectPermissions[];
}

export interface ProjectPermissions {
  role: "owner" | "member" | "admin";
  permissions:
    | "PROJECT_INVITE_USERS"
    | "PROJECT_KICK_USERS"
    | "PROJECT_SET_ROLES"
    | "PROJECT_EDIT"
    | "PROJECT_ARCHIVE"
    | "PROJECT_DELETE"
    | "PROJECT_GET_CANDIDATES";
}

export interface ProjectMember {
  email: string;
  id: number;
  roles: string[];
  username: string;
}
