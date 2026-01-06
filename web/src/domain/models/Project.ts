import type { Permission } from "../valueobjects/Permission";
import { ProjectId } from "../valueobjects/ProjectId";
import { Timestamp } from "../valueobjects/Timestamp";
import { UserRole } from "../valueobjects/UserRole";

export class Project {
  private constructor(
    public readonly id: ProjectId,
    public name: string,
    public description: string | undefined,
    public readonly createdAt: Timestamp,
    public readonly userRole: UserRole,
    public readonly tasksCount: number = 0,
  ) {}

  static fromBackendData(
    id: string | number,
    name: string,
    description: string | undefined,
    createdAt: string,
    permissions: Permission[],
    tasksCount: number = 0,
  ): Project {
    return new Project(
      ProjectId.create(id),
      name,
      description,
      Timestamp.fromString(createdAt),
      UserRole.fromPermissions(permissions),
      tasksCount,
    );
  }

  canUserEdit(): boolean {
    return this.userRole.canEditProject();
  }

  canUserDelete(): boolean {
    return this.userRole.canDeleteProject();
  }

  canUserArchive(): boolean {
    return this.userRole.canArchiveProject();
  }

  canUserManageMembers(): boolean {
    return this.userRole.canManageMembers();
  }

  canUserInviteMembers(): boolean {
    return this.userRole.canInviteUsers();
  }

  canUserKickMembers(): boolean {
    return this.userRole.canKickUsers();
  }

  canUserDeleteTask(): boolean {
    return this.userRole.canDeleteTask();
  }

  canUserUpdateTask(): boolean {
    return this.userRole.canUpdateTask();
  }

  canUserViewProject(): boolean {
    return this.userRole.isViewer();
  }

  isOwner(): boolean {
    return this.userRole.isOwner();
  }

  isAdmin(): boolean {
    return this.userRole.isAdmin();
  }

  hasPermission(permission: Permission): boolean {
    return this.userRole.toPermissions().includes(permission);
  }

  getUserRoleLabel(): string {
    return this.userRole.toString();
  }

  getUserRoleLabelLocalized(): string {
    const labels: Record<string, string> = {
      OWNER: "Владелец",
      ADMIN: "Администратор",
      EDITOR: "Редактор",
      VIEWER: "Просмотр",
      NONE: "Нет доступа",
    };
    return labels[this.getUserRoleLabel()] || "Неизвестная роль";
  }

  getPermissions(): Permission[] {
    return this.userRole.toPermissions();
  }

  equals(other: Project): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `Project(id=${this.id}, name=${this.name}, role=${this.getUserRoleLabel()})`;
  }
}
