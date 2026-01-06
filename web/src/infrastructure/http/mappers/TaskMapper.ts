import { Task } from "@/domain/models/Task";

import type {
  ChangeAssigneePayload,
  ChangeStatusPayload,
  CreateTaskPayload,
  TaskDTO,
  UpdateTaskPayload,
} from "../dto/TaskDTO";

export class TaskMapper {
  static toDomain(dto: TaskDTO): Task {
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
  }

  static toDTO(task: Task): TaskDTO {
    return {
      id: task.id.value as number,
      name: task.title,
      description: task.description,
      statusId: task.statusId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      projectId: task.projectId.value as number,
      authorId: task.authorId,
      assigneeId: task.assigneeId,
    };
  }

  static toDomainList(dtos: TaskDTO[]): Task[] {
    return dtos.map((dto) => this.toDomain(dto));
  }

  static toCreatePayload(
    name: string,
    description: string | undefined,
    assigneeId: number | undefined,
    projectId: string | number,
  ): CreateTaskPayload {
    return {
      name,
      description,
      assigneeId: Number(assigneeId),
      projectId: Number(projectId),
    };
  }

  static toUpdatePayload(name?: string, description?: string): UpdateTaskPayload {
    return {
      name,
      description,
    };
  }

  static toChangeAssigneePayload(taskId: number, assigneeId?: number): ChangeAssigneePayload {
    return {
      id: taskId,
      assigneeId,
    };
  }
  static toChangeStatusPayload(taskId: number, statusId?: number): ChangeStatusPayload {
    return {
      id: taskId,
      statusId,
    };
  }
}
