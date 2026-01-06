import type { ProjectDetailResponseDto } from "@/application/dto/ProjectDetailResponseDto";
import { ProjectMemberResponseMapper } from "@/application/dto/ProjectMemberResponseDto";
import { ProjectResponseMapper } from "@/application/dto/ProjectResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import { UserResponseMapper } from "@/application/dto/UserResponseDto";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class GetProjectDetailUseCase {
  constructor(
    private projectRepository: ProjectRepository,
    private projectMemberRepository: ProjectMemberRepository,
    private taskRepository: TaskRepository,
  ) {}

  async execute(projectId: string | number): Promise<ProjectDetailResponseDto> {
    try {
      clientLogger.info("Fetching project detail", { projectId });

      const id = ProjectId.create(projectId);

      const [project, members, tasks] = await Promise.all([
        this.projectRepository.findById(id),
        this.projectMemberRepository.findByProjectId(id),
        this.taskRepository.findByProjectId(id),
      ]);

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const ownerMember = members.find((m) => m.isOwner());
      if (!ownerMember) {
        throw new Error(`Project owner not found: ${projectId}`);
      }

      const response: ProjectDetailResponseDto = {
        project: ProjectResponseMapper.fromDomain(project),
        members: ProjectMemberResponseMapper.fromDomainList(members),
        owner: UserResponseMapper.fromProjectMember(ownerMember),
        tasks: TaskResponseMapper.fromDomainList(tasks),
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
  }
}
