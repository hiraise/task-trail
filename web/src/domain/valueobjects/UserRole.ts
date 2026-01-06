import { Permission } from "./Permission";

export class UserRole {
  private constructor(private readonly permissions: Set<Permission>) {}

  static fromPermissions(permissions: Permission[]): UserRole {
    return new UserRole(new Set(permissions || []));
  }

  static empty(): UserRole {
    return new UserRole(new Set());
  }

  canEditProject(): boolean {
    return this.hasPermission(Permission.PROJECT_EDIT) || this.isAdmin() || this.isOwner();
  }

  canDeleteProject(): boolean {
    return this.isOwner();
  }

  canArchiveProject(): boolean {
    return this.isAdmin() || this.isOwner();
  }

  canManageMembers(): boolean {
    return this.hasPermission(Permission.PROJECT_SET_ROLES) || this.isAdmin() || this.isOwner();
  }

  canInviteUsers(): boolean {
    return this.hasPermission(Permission.PROJECT_INVITE_USERS) || this.isAdmin() || this.isOwner();
  }

  canKickUsers(): boolean {
    return this.hasPermission(Permission.PROJECT_KICK_USERS) || this.isAdmin() || this.isOwner();
  }

  canDeleteTask(): boolean {
    return this.hasPermission(Permission.PROJECT_DELETE_TASK) || this.isAdmin() || this.isOwner();
  }

  canUpdateTask(): boolean {
    return this.hasPermission(Permission.PROJECT_UPDATE_TASK) || this.isAdmin() || this.isOwner();
  }

  canGetCandidates(): boolean {
    return (
      this.hasPermission(Permission.PROJECT_GET_CANDIDATES) || this.isAdmin() || this.isOwner()
    );
  }

  isOwner(): boolean {
    return this.hasPermission(Permission.PROJECT_OWNER);
  }

  isAdmin(): boolean {
    return this.hasPermission(Permission.PROJECT_ADMIN);
  }

  isEditor(): boolean {
    return (
      this.hasPermission(Permission.PROJECT_UPDATE_TASK) || this.canEditProject() || this.isAdmin()
    );
  }

  isViewer(): boolean {
    return this.permissions.size > 0;
  }

  private hasPermission(permission: Permission): boolean {
    return this.permissions.has(permission);
  }

  toPermissions(): Permission[] {
    return Array.from(this.permissions);
  }

  toString(): string {
    if (this.isOwner()) return "OWNER";
    if (this.isAdmin()) return "ADMIN";
    if (this.isEditor()) return "EDITOR";
    if (this.isViewer()) return "VIEWER";
    return "NONE";
  }

  equals(other: UserRole): boolean {
    if (this.permissions.size !== other.permissions.size) {
      return false;
    }
    for (const perm of this.permissions) {
      if (!other.permissions.has(perm)) {
        return false;
      }
    }
    return true;
  }
}
