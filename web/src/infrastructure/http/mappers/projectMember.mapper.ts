import { ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/valueobjects/ProjectId";

import type { ProjectMemberDTO } from "../dto/ProjectMemberDTO";

/**
 * Maps a project member DTO received from the API into the domain model.
 *
 * @param dto - The API data transfer object containing member details.
 * @param projectId - The domain project identifier the member belongs to.
 * @returns A `ProjectMember` domain entity created from backend data.
 */
export const mapApiProjectMemberToDomain = (
  dto: ProjectMemberDTO,
  projectId: ProjectId,
): ProjectMember => {
  return ProjectMember.fromBackendData(
    dto.id,
    projectId.value,
    dto.email,
    dto.username,
    dto.permissions,
  );
};

/**
 * Maps an array of ProjectMemberDTO objects to domain ProjectMember entities for a given project.
 *
 * @param dtos - The API project member DTOs to map.
 * @param projectId - The project identifier to associate with each mapped member.
 * @returns The mapped array of ProjectMember domain entities.
 */
export const mapApiProjectMembersToDomain = (
  dtos: ProjectMemberDTO[],
  projectId: ProjectId,
): ProjectMember[] => dtos.map((dto) => mapApiProjectMemberToDomain(dto, projectId));
