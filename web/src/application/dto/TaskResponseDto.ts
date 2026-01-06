import type { Task } from "@/domain/models/Task";

export interface TaskResponseDto {
  id: number;
  title: string;
  description?: string;
  statusId: number;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  authorId: number;
  assigneeId?: number;
}

export class TaskResponseMapper {
  static fromDomain(task: Task): TaskResponseDto {
    return {
      id: Number(task.id.value),
      title: task.title,
      description: task.description,
      statusId: task.statusId,
      createdAt: task.createdAt.toString(),
      updatedAt: task.updatedAt.toString(),
      projectId: Number(task.projectId),
      authorId: task.authorId,
      assigneeId: task.assigneeId,
    };
  }

  static fromDomainList(tasks: Task[]): TaskResponseDto[] {
    return tasks.map((task) => this.fromDomain(task));
  }
}
