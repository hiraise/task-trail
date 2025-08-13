import { PermissionType } from "@/domain/project/project.entity";

export function hasPermission(permissions: PermissionType[], requiredPermission: PermissionType) {
  if (permissions.length === 0) return false;
  return permissions.includes(requiredPermission);
}
