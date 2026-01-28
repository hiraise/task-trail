import type { TaskStatus } from "@/domain/valueobjects/TaskStatus";

export interface TaskStatusResponseDto {
  id: string | number;
  name: string;
  isDefault: boolean;
  isResolved: boolean;
}

/**
 * Maps a TaskStatus domain entity to a TaskStatusResponseDto.
 *
 * @param status - The TaskStatus entity to be mapped
 * @returns A TaskStatusResponseDto containing the mapped properties
 *
 * @example
 * ```ts
 * const taskStatus: TaskStatus = {
 *   id: '123',
 *   name: 'In Progress',
 *   isDefault: false,
 *   isResolved: false
 * };
 * const dto = mapTaskStatusToResponse(taskStatus);
 * ```
 */
export const mapTaskStatusToResponse = (status: TaskStatus): TaskStatusResponseDto => {
  return {
    id: status.id,
    name: status.name,
    isDefault: status.isDefault,
    isResolved: status.isResolved,
  };
};

/**
 * Maps an array of TaskStatus entities to an array of TaskStatusResponseDto objects.
 *
 * @param statuses - An array of TaskStatus entities to be mapped
 * @returns An array of TaskStatusResponseDto objects corresponding to the input statuses
 *
 * @remarks
 * This function iterates through each TaskStatus in the input array and applies
 * the mapTaskStatusToResponse transformation to convert it into a response DTO.
 */
export const mapTaskStatusesToResponse = (statuses: TaskStatus[]): TaskStatusResponseDto[] =>
  statuses.map((status) => mapTaskStatusToResponse(status));
