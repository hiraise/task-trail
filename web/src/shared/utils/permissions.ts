import { PERMISSIONS, PermissionType } from "@/domain/project/project.entity";

export function hasPermission(permissions: PermissionType[], requiredPermission: PermissionType) {
  if (permissions.length === 0) return false;
  return permissions.includes(requiredPermission);
}

interface MemberManagementPermissions {
  canChangeRole: boolean;
  canKick: boolean;
}

export class MemberPermissions {
  constructor(private readonly userPermissions: PermissionType[]) {}

  canManageRoles(): boolean {
    return this.checkPermission(PERMISSIONS.PROJECT_SET_ROLES);
  }

  canKickMembers(): boolean {
    return this.checkPermission(PERMISSIONS.PROJECT_KICK_USERS);
  }

  canManageMember(targetMemberId: number, currentUserId: number): MemberManagementPermissions {
    const isSelf = targetMemberId === currentUserId;

    return {
      canChangeRole: !isSelf && this.canManageRoles(),
      canKick: !isSelf && this.canKickMembers(),
    };
  }

  private checkPermission(permission: PermissionType): boolean {
    return hasPermission(this.userPermissions, permission);
  }
}
