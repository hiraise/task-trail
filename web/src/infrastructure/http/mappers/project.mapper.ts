import { Project } from "@/domain/models/Project";
import { Permission } from "@/domain/valueobjects/Permission";

import type { ProjectDTO } from "../dto/ProjectDTO";

/**
 * Maps a ProjectDTO into a Project domain model.
 *
 * @param dto - The data transfer object received from the backend.
 * @returns The corresponding Project domain instance.
 */
export const mapApiProjectToDomain = (dto: ProjectDTO): Project => {
  const permissions = dto.permissions ? dto.permissions.map(Permission.fromString) : [];
  return Project.fromBackendData(
    dto.id,
    dto.name,
    dto.description,
    dto.createdAt,
    permissions,
    dto.tasksCount,
  );
};

/**
 * Maps an array of API project DTOs to an array of domain project models.
 *
 * @param dtos - The list of project DTOs received from the API.
 * @returns An array of domain `Project` instances.
 */
export const mapApiProjectsToDomain = (dtos: ProjectDTO[]): Project[] =>
  dtos.map((dto) => mapApiProjectToDomain(dto));
