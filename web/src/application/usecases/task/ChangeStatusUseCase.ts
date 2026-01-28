import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import type { ChangeStatusPayload } from "@/application/payloads";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type ChangeStatusUseCase = (payload: ChangeStatusPayload) => Promise<TaskResponseDto>;

const createChangeStatusUseCase =
  (taskRepository: TaskRepository, projectRepository: ProjectRepository): ChangeStatusUseCase =>
  async (payload) => {
    try {
      clientLogger.info("ChangeStatusUseCase: Changing status for task", {
        taskId: payload.taskId,
      });

      const taskId = TaskId.create(payload.taskId);
      const task = await taskRepository.findById(taskId);

      if (!task) {
        throw new AppError(AppErrorType.NOT_FOUND, `Task not found: ${payload.taskId}`);
      }

      const statuses = await projectRepository.getProjectStatuses(task.projectId);
      const targetStatus = statuses.find((status) => status.id === payload.statusId);

      if (!targetStatus) {
        throw new AppError(
          AppErrorType.VALIDATION,
          `Status with id ${payload.statusId} not found in project ${task.projectId.value}`,
        );
      }

      // TODO: Add check rights to change status

      // Saving
      const updatedTask = await taskRepository.changeStatus(task, payload.statusId);

      clientLogger.info("ChangeStatusUseCase: Status changed successfully", {
        taskID: updatedTask.id.value,
        statusID: payload.statusId,
      });

      return TaskResponseMapper.fromDomain(updatedTask);
    } catch (error) {
      clientLogger.error("ChangeStatusUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createChangeStatusUseCase, type ChangeStatusUseCase };
