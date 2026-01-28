import { Task } from "@/domain/models/Task";

import type { TaskDTO } from "../dto/TaskDTO";

/**
 * Maps a TaskDTO received from the API into a Task domain entity.
 *
 * @param dto - The task data transfer object from the backend.
 * @returns A Task instance created from backend data.
 */
export const mapApiTaskToDomain = (dto: TaskDTO): Task => {
  return Task.fromBackendData(
    dto.id,
    dto.name,
    dto.description,
    dto.statusId,
    dto.createdAt,
    dto.updatedAt,
    dto.projectId,
    dto.authorId,
    dto.assigneeId,
  );
};

/**
 * Maps an array of task DTOs from the API layer to domain Task entities.
 *
 * @param dtos - The list of TaskDTO objects to convert.
 * @returns An array of domain Task objects produced by mapping each DTO.
 */
export const mapApiTasksToDomain = (dtos: TaskDTO[]): Task[] =>
  dtos.map((dto) => mapApiTaskToDomain(dto));
