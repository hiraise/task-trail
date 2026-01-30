import type { ProjectDetailResponseDto } from "@/application/dto/ProjectDetailResponseDto";
import { createProjectMember, isProjectMemberOwner } from "@/domain/models/ProjectMember";
import { createUser } from "@/domain/models/User";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { ProjectId } from "@/domain/types";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetProjectDetailUseCase = (projectId: ProjectId) => Promise<ProjectDetailResponseDto>;

const createGetProjectDetailUseCase =
  (
    projectRepository: ProjectRepository,
    projectMemberRepository: ProjectMemberRepository,
    taskRepository: TaskRepository,
  ): GetProjectDetailUseCase =>
  async (projectId) => {
    try {
      clientLogger.info("Fetching project detail", { projectId });

      const [project, members, tasks] = await Promise.all([
        projectRepository.findById(projectId),
        projectMemberRepository.findByProjectId(projectId),
        taskRepository.findByProjectId(projectId),
      ]);

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const ownerMember = members.find(isProjectMemberOwner);

      if (!ownerMember) {
        throw new Error(`Project owner not found: ${projectId}`);
      }

      const response: ProjectDetailResponseDto = {
        project: project,
        members: members.map(createProjectMember),
        owner: createUser(ownerMember),
        tasks: tasks,
      };

      clientLogger.info("Project detail fetched successfully", {
        projectId,
        membersCount: members.length,
        tasksCount: project.tasksCount,
      });

      return response;
    } catch (error) {
      clientLogger.error("GetProjectDetailUseCase: failed", { error, projectId });
      throw error;
    }
  };

export { createGetProjectDetailUseCase, type GetProjectDetailUseCase };
