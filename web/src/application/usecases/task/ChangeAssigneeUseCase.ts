import type { ChangeAssigneePayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type ChangeAssigneeUseCase = (payload: ChangeAssigneePayload) => Promise<Task>;

const createChangeAssigneeUseCase =
  (taskRepository: TaskRepository, userRepository: UserRepository): ChangeAssigneeUseCase =>
  async (payload) => {
    try {
      clientLogger.info("ChangeAssigneeUseCase: Changing assignee for task", {
        taskId: payload.taskId,
      });

      const task = await taskRepository.findById(payload.taskId);

      if (!task) {
        throw new AppError(AppErrorType.NOT_FOUND, `Task not found: ${payload.taskId}`);
      }

      const assigneeId = payload.assigneeId ?? "";

      // TODO: Add check rights to change assignee
      // TODO: Add check user existance

      // Saving
      const updatedTask = await taskRepository.changeAssignee(task, assigneeId);

      clientLogger.info("ChangeAssigneeUseCase: Assignee changed successfully", {
        taskID: updatedTask.id,
        assigneeID: assigneeId,
      });

      return updatedTask;
    } catch (error) {
      clientLogger.error("ChangeAssigneeUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createChangeAssigneeUseCase, type ChangeAssigneeUseCase };
