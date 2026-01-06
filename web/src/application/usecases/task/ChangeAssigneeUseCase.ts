import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import type { ChangeAssigneePayload } from "@/application/payloads";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { UserId } from "@/domain/valueobjects/UserId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class ChangeAssigneeUseCase {
  constructor(private taskRepository: TaskRepository, private userRepository: UserRepository) {}

  async execute(payload: ChangeAssigneePayload): Promise<TaskResponseDto> {
    try {
      clientLogger.info("ChangeAssigneeUseCase: Changing assignee for task", {
        taskId: payload.taskId,
      });

      const taskId = TaskId.create(payload.taskId);
      const task = await this.taskRepository.findById(taskId);

      if (!taskId) {
        throw new AppError(AppErrorType.NOT_FOUND, `Task not found: ${taskId}`);
      }

      const assigneeId = UserId.create(payload.assigneeId);

      // TODO: Add check rights to change assignee
      // TODO: Add check user existance

      // Saving
      const updatedTask = await this.taskRepository.changeAssignee(task, assigneeId);

      clientLogger.info("ChangeAssigneeUseCase: Assignee changed successfully", {
        taskID: updatedTask.id.value,
        assigneeID: assigneeId.value,
      });

      return TaskResponseMapper.fromDomain(updatedTask);
    } catch (error) {
      clientLogger.error("ChangeAssigneeUseCase: failed", { error, command: payload });
      throw error;
    }
  }
}
