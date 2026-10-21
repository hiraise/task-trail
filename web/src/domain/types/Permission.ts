import z from "zod";

const PERMISSION_VALUES = [
  "PROJECT_INVITE_USERS",
  "PROJECT_KICK_USERS",
  "PROJECT_SET_ROLES",
  "PROJECT_EDIT",
  "PROJECT_ARCHIVE",
  "PROJECT_DELETE",
  "PROJECT_DELETE_TASK",
  "PROJECT_GET_CANDIDATES",
  "PROJECT_OWNER",
  "PROJECT_ADMIN",
  "PROJECT_UPDATE_TASK",
  "PROJECT_CREATE_TASK",
] as const;

export const PermissionSchema = z.enum(PERMISSION_VALUES);

export type Permission = z.infer<typeof PermissionSchema>;
