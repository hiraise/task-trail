import { mapProjectToResponse } from "@/application/dto/ProjectResponseDto";
import type { TaskDetailResponseDto } from "@/application/dto/TaskDetailResponseDto";
import { mapTaskToResponse } from "@/application/dto/TaskResponseDto";
import { mapTaskStatusToResponse } from "@/application/dto/TaskStatusResponseDto";
import { mapUserToResponse } from "@/application/dto/UserResponseDto";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { UserId } from "@/domain/valueobjects/UserId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetTaskDetailUseCase = (taskId: string | number) => Promise<TaskDetailResponseDto>;

const createGetTaskDetailUseCase =
  (
    taskRepository: TaskRepository,
    userRepository: UserRepository,
    projectRepository: ProjectRepository,
  ): GetTaskDetailUseCase =>
  async (taskId) => {
    try {
      clientLogger.info("GetTaskDetailUseCase: Fetching task details", { taskId });

      const id = TaskId.create(taskId);
      const task = await taskRepository.findById(id);

      if (!task) throw new Error(`Task with id ${taskId} not found`);

      const assigneeId = UserId.create(task.assigneeId ?? -1);

      const [project, assignee, statuses] = await Promise.all([
        projectRepository.findById(task.projectId),
        task.assigneeId ? userRepository.findById(assigneeId) : null,
        projectRepository.getProjectStatuses(task.projectId),
      ]);

      const status = statuses.find((status) => status.id === task.statusId);

      if (!project) throw new Error(`Project not found`);
      if (!assignee) throw new Error(`Assignee not found`);
      if (!status) throw new Error(`Status not found`);

      clientLogger.info("GetTaskDetailUseCase: Task detail fetched", { taskId });

      const response: TaskDetailResponseDto = {
        task: mapTaskToResponse(task),
        project: mapProjectToResponse(project),
        assignee: mapUserToResponse(assignee),
        status: mapTaskStatusToResponse(status),
      };

      return response;
    } catch (error) {
      clientLogger.error("GetTaskDetailUseCase: failed", { error, taskId });
      throw error;
    }
  };

export { createGetTaskDetailUseCase, type GetTaskDetailUseCase };
