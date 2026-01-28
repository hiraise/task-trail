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

/**
 * Maps a Project domain entity to a ProjectResponseDto for API responses.
 *
 * This function transforms a Project domain object into a data transfer object (DTO)
 * that can be safely serialized and sent to clients. It extracts all relevant project
 * information including permissions, user roles, and metadata.
 *
 * @param project - The Project domain entity to be mapped
 * @returns A ProjectResponseDto containing the project's serialized data with:
 *   - Basic information (id, name, description)
 *   - Timestamps (createdAt in ISO 8601 format)
 *   - User permissions (canEdit, canDelete, canManageMembers, canArchiveProject, isOwner)
 *   - User role label
 *   - Tasks count
 *
 * @example
 * ```typescript
 * const project = new Project(...);
 * const responseDto = mapProjectToResponse(project);
 * // Returns: { id: "123", name: "My Project", ... }
 * ```
 */
export const mapProjectToResponse = (project: Project): ProjectResponseDto => {
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
};

/**
 * Maps an array of Project entities to an array of ProjectResponseDto objects.
 *
 * @param projects - An array of Project entities to be mapped
 * @returns An array of ProjectResponseDto objects
 */
export const mapProjectsToResponse = (projects: Project[]): ProjectResponseDto[] =>
  projects.map((project) => mapProjectToResponse(project));
