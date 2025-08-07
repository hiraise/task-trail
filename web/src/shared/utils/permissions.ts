import { PermissionType } from "@/domain/project/project.entity";

export function hasPermission(permissions: PermissionType[], requiredPermission: PermissionType) {
  return permissions.includes(requiredPermission);
}
