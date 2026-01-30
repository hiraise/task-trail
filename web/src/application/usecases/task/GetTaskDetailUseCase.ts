import type { TaskDetailResponseDto } from "@/application/dto/TaskDetailResponseDto";
import { createProjectDetails } from "@/domain/models/Project";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import type { TaskId } from "@/domain/types";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetTaskDetailUseCase = (taskId: TaskId) => Promise<TaskDetailResponseDto>;

const createGetTaskDetailUseCase =
  (
    taskRepository: TaskRepository,
    userRepository: UserRepository,
    projectRepository: ProjectRepository,
  ): GetTaskDetailUseCase =>
  async (taskId) => {
    try {
      clientLogger.info("GetTaskDetailUseCase: Fetching task details", { taskId });

      const task = await taskRepository.findById(taskId);

      if (!task) throw new Error(`Task with id ${taskId} not found`);

      const [project, assignee, statuses] = await Promise.all([
        projectRepository.findById(task.projectId),
        task.assigneeId ? userRepository.findById(task.assigneeId) : null,
        projectRepository.getProjectStatuses(task.projectId),
      ]);

      const status = statuses.find((status) => status.id === task.statusId);

      if (!project) throw new Error(`Project not found`);
      if (task.assigneeId && !assignee) throw new Error(`Assignee not found`);
      if (!status) throw new Error(`Status not found`);

      clientLogger.info("GetTaskDetailUseCase: Task detail fetched", { taskId });

      const response: TaskDetailResponseDto = {
        task: task,
        project: createProjectDetails(project),
        assignee: assignee ? assignee : null,
        status: status,
      };

      return response;
    } catch (error) {
      clientLogger.error("GetTaskDetailUseCase: failed", { error, taskId });
      throw error;
    }
  };

export { createGetTaskDetailUseCase, type GetTaskDetailUseCase };
