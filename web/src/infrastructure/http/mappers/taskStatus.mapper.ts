import { TaskStatus } from "@/domain/valueobjects/TaskStatus";

import type { TaskStatusDTO } from "../dto/TaskDTO";

/**
 * Maps a task status DTO from the API layer into the domain `TaskStatus` model.
 *
 * @param dto - The API task status data transfer object to convert.
 * @returns A domain `TaskStatus` instance constructed from the DTO fields.
 */
export const mapApiTaskStatusToDomain = (dto: TaskStatusDTO): TaskStatus => {
  return new TaskStatus(dto.id, dto.name, dto.isDefault, dto.isResolved);
};

/**
 * Maps an array of API task status DTOs into their domain model equivalents.
 *
 * @param dtos - The list of task status DTOs received from the API.
 * @returns An array of domain `TaskStatus` objects.
 */
export const mapApiTaskStatusesToDomain = (dtos: TaskStatusDTO[]): TaskStatus[] =>
  dtos.map((dto) => mapApiTaskStatusToDomain(dto));
