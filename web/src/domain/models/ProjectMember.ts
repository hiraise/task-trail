import { Email } from "../valueobjects/Email";
import { Permission } from "../valueobjects/Permission";
import { ProjectId } from "../valueobjects/ProjectId";
import { ProjectMemberId } from "../valueobjects/ProjectMemberId";
import { UserRole } from "../valueobjects/UserRole";

export class ProjectMember {
  private constructor(
    public readonly id: ProjectMemberId,
    public readonly projectId: ProjectId,
    public email: Email,
    public username: string,
    public readonly userRole: UserRole,
  ) {}

  static fromBackendData(
    id: number,
    projectId: string | number,
    email: string,
    username: string,
    permissions: string[],
  ): ProjectMember {
    const permissionObjects = permissions.map((permString) => Permission.fromString(permString));

    return new ProjectMember(
      ProjectMemberId.create(id),
      ProjectId.create(projectId),
      Email.create(email),
      username,
      UserRole.fromPermissions(permissionObjects),
    );
  }

  canEditProject(): boolean {
    return this.userRole.canEditProject();
  }

  canDeleteProject(): boolean {
    return this.userRole.canDeleteProject();
  }

  canManageMembers(): boolean {
    return this.userRole.canManageMembers();
  }

  canDeleteTask(): boolean {
    return this.userRole.canDeleteTask();
  }

  canUpdateTask(): boolean {
    return this.userRole.canUpdateTask();
  }

  isOwner(): boolean {
    return this.userRole.isOwner();
  }

  isAdmin(): boolean {
    return this.userRole.isAdmin();
  }

  isEditor(): boolean {
    return this.userRole.isEditor();
  }

  isViewer(): boolean {
    return this.userRole.isViewer();
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

  getDisplayName(): string {
    return this.username || this.email.toString();
  }

  getPermissions(): Permission[] {
    return this.userRole.toPermissions();
  }

  equals(other: ProjectMember): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `ProjectMember(id=${this.id}, email=${this.email}, role=${this.getUserRoleLabel()})`;
  }
}
