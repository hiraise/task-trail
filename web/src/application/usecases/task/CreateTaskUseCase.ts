import type { CreateTaskCommand } from "@/application/commands/task/CreateTaskCommand";
import type { TaskResponseDto} from "@/application/dto/TaskResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class CreateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(command: CreateTaskCommand): Promise<TaskResponseDto> {
    try {
      clientLogger.info("CreateTaskUseCase: Creating new task", { name: command.name });
      this.validateCommand(command);

      const taskId = await this.taskRepository.create({
        name: command.name,
        description: command.description,
        assigneeId: command.assigneeId,
        projectId: ProjectId.create(command.projectId),
      });

      clientLogger.info("Task created successfully", { taskId: taskId.toString() });
      const createdTask = await this.taskRepository.findById(taskId);

      return TaskResponseMapper.fromDomain(createdTask);
    } catch (error) {
      clientLogger.error("CreateProjectUseCase: failed", { error, command });
      throw error;
    }
  }

  private validateCommand(command: CreateTaskCommand): void {
    if (!command.name || command.name.trim().length < 6) {
      throw new AppError(AppErrorType.VALIDATION, "Task name must be at least 6 characters");
    }

    if (command.name.length > 100) {
      throw new AppError(AppErrorType.VALIDATION, "Task name must not exceed 100 characters");
    }

    if (command.description && command.description.length > 1000) {
      throw new AppError(
        AppErrorType.VALIDATION,
        "Task description must not exceed 1000 characters",
      );
    }
  }
}
