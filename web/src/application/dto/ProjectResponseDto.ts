import type { Project } from "@/domain/models/Project";
import { Permission } from "@/domain/valueobjects/Permission";

export interface ProjectResponseDto {
  id: string | number;
  name: string;
  description?: string;
  createdAt: string;
  role: string;
  tasksCount: number;

  // UI flags
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canArchiveProject: boolean;
  isOwner: boolean;
}

export class ProjectResponseMapper {
  static fromDomain(project: Project): ProjectResponseDto {
    return {
      id: project.id.value,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
      role: project.getUserRoleLabel(),
      tasksCount: project.tasksCount,
      canEdit: project.canUserEdit(),
      canDelete: project.canUserDelete(),
      canManageMembers: project.canUserManageMembers(),
      canArchiveProject: project.hasPermission(Permission.PROJECT_ARCHIVE),
      isOwner: project.isOwner(),
    };
  }

  static fromDomainList(projects: Project[]): ProjectResponseDto[] {
    return projects.map((project) => this.fromDomain(project));
  }
}
