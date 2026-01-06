import type { EditTaskCommand } from "@/application/commands/task/EditTaskCommand";
import type { TaskResponseDto} from "@/application/dto/TaskResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class EditTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(command: EditTaskCommand): Promise<TaskResponseDto> {
    try {
      clientLogger.info("Editing task", { taskId: command.taskId });

      const taskId = TaskId.create(command.taskId);
      const task = await this.taskRepository.findById(taskId);

      if (!taskId) {
        throw new AppError(AppErrorType.NOT_FOUND, `Task not found: ${taskId}`);
      }

      // TODO: Add check rights to edit task

      // Validation
      if (command.title !== undefined) {
        this.validateName(command.title);
        task.title = command.title;
      }

      if (command.description !== undefined) {
        this.validateDescription(command.description);
        task.description = command.description;
      }

      // Saving
      const updatedTask = await this.taskRepository.update(task);

      clientLogger.info("Task updated successfully", { taskID: updatedTask.id.value });

      return TaskResponseMapper.fromDomain(updatedTask);
    } catch (error) {
      clientLogger.error("EditTaskUseCase: failed", { error, command });
      throw error;
    }
  }

  private validateName(name: string): void {
    if (name.trim().length < 3) {
      throw new AppError(AppErrorType.VALIDATION, "Task title must be at least 3 characters");
    }

    if (name.length > 100) {
      throw new AppError(AppErrorType.VALIDATION, "Task title must not exceed 100 characters");
    }
  }

  private validateDescription(description: string): void {
    if (description.length > 1000) {
      throw new AppError(
        AppErrorType.VALIDATION,
        "Task description must not exceed 1000 characters",
      );
    }
  }
}
