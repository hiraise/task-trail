import type { Task } from "@/domain/models/Task";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { ProjectId } from "@/domain/types";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetProjectTasksUseCase = (projectId: ProjectId) => Promise<Task[]>;

const createGetProjectTasksUseCase =
  (taskRepository: TaskRepository): GetProjectTasksUseCase =>
  async (projectId) => {
    try {
      clientLogger.info("GetProjectTasksUseCase: fetching all project tasks", { projectId });

      const tasks = await taskRepository.findByProjectId(projectId);

      clientLogger.info("GetProjectTasksUseCase: project tasks fetched successfully", {
        count: tasks.length,
      });

      return tasks;
    } catch (error) {
      clientLogger.error("GetProjectTasksUseCase: failed", { error });
      throw error;
    }
  };

export { createGetProjectTasksUseCase, type GetProjectTasksUseCase };
