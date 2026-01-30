import type { Permission } from "../../domain/types";

export const getUserRole = (permissions: Permission[]): UserRole => {
  if (permissions.includes("PROJECT_OWNER")) return "OWNER";
  if (permissions.includes("PROJECT_ADMIN")) return "ADMIN";
  if (permissions.includes("PROJECT_EDIT")) return "EDITOR";
  if (permissions.length > 0) return "VIEWER";
  return "NONE";
};

export const canEditProject = (permissions: Permission[]): boolean =>
  permissions.includes("PROJECT_EDIT") ||
  permissions.includes("PROJECT_ADMIN") ||
  permissions.includes("PROJECT_OWNER");

export const canDeleteProject = (permissions: Permission[]): boolean =>
  permissions.includes("PROJECT_OWNER");

export const canArchiveProject = (permissions: Permission[]): boolean =>
  permissions.includes("PROJECT_OWNER");

export const canManageMembers = (permissions: Permission[]): boolean =>
  permissions.includes("PROJECT_SET_ROLES") ||
  permissions.includes("PROJECT_ADMIN") ||
  permissions.includes("PROJECT_OWNER");

export const canInviteUsers = (permissions: Permission[]): boolean =>
  permissions.includes("PROJECT_INVITE_USERS") ||
  permissions.includes("PROJECT_ADMIN") ||
  permissions.includes("PROJECT_OWNER");

export const canDeleteTask = (permissions: Permission[]): boolean =>
  permissions.includes("PROJECT_DELETE_TASK") ||
  permissions.includes("PROJECT_ADMIN") ||
  permissions.includes("PROJECT_OWNER");

export const canUpdateTask = (permissions: Permission[]): boolean =>
  permissions.includes("PROJECT_UPDATE_TASK") ||
  permissions.includes("PROJECT_ADMIN") ||
  permissions.includes("PROJECT_OWNER");

export const isOwner = (permissions: Permission[]): boolean =>
  permissions.includes("PROJECT_OWNER");

export const isAdmin = (permissions: Permission[]): boolean =>
  permissions.includes("PROJECT_ADMIN");

export const isEditor = (permissions: Permission[]): boolean =>
  canUpdateTask(permissions) || canEditProject(permissions) || isAdmin(permissions);

export const isViewer = (permissions: Permission[]): boolean => permissions.length > 0;

export const hasPermission = (permissions: Permission[], permission: Permission): boolean =>
  permissions.includes(permission);

export type UserRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" | "NONE";
