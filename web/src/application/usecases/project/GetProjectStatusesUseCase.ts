import type { TaskStatus } from "@/domain/models/TaskStatus";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { ProjectId } from "@/domain/types";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetProjectStatusesUseCase = (projectId: ProjectId) => Promise<TaskStatus[]>;

const createGetProjectStatusesUseCase =
  (projectRepository: ProjectRepository): GetProjectStatusesUseCase =>
  async (projectId) => {
    try {
      clientLogger.info("GetProjectStatusesUseCase: fetching all project statuses");

      const statuses = await projectRepository.getProjectStatuses(projectId);

      clientLogger.info("GetProjectStatusesUseCase: project statuses fetched successfully", {
        count: statuses.length,
      });

      return statuses;
    } catch (error) {
      clientLogger.error("GetProjectStatusesUseCase: failed", { error });
      throw error;
    }
  };

export { createGetProjectStatusesUseCase, type GetProjectStatusesUseCase };
