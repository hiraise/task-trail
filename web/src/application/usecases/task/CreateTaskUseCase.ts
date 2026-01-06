import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import type { CreateTaskPayload } from "@/application/payloads";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class CreateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(payload: CreateTaskPayload): Promise<TaskResponseDto> {
    try {
      clientLogger.info("CreateTaskUseCase: Creating new task", { name: payload.name });

      const taskId = await this.taskRepository.create({
        name: payload.name,
        description: payload.description,
        assigneeId: payload.assigneeId,
        projectId: ProjectId.create(payload.projectId),
      });

      clientLogger.info("Task created successfully", { taskId: taskId.toString() });
      const createdTask = await this.taskRepository.findById(taskId);

      return TaskResponseMapper.fromDomain(createdTask);
    } catch (error) {
      clientLogger.error("CreateProjectUseCase: failed", { error, command: payload });
      throw error;
    }
  }
}
