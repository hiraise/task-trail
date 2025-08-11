import { PermissionType, RoleType } from "@/domain/project/project.entity";

export interface NegativePermission {
  _type: "NOT";
  permission: PermissionType;
}

export function hasPermission(permissions: PermissionType[], requiredPermission: PermissionType) {
  if (permissions.length === 0) return false;
  return permissions.includes(requiredPermission);
}

export function hasRole(roles: RoleType[], requiredRole: RoleType) {
  return roles.includes(requiredRole);
}

export function not(permission: PermissionType): NegativePermission {
  return { _type: "NOT", permission: permission };
}
