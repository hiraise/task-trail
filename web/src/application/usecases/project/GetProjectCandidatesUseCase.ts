import type { UserResponseDto } from "@/application/dto/UserResponseDto";
import { mapUsersToResponse } from "@/application/dto/UserResponseDto";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetProjectCandidatesUseCase = (projectId?: string | number) => Promise<UserResponseDto[]>;

const createGetProjectCandidatesUseCase =
  (userRepository: UserRepository): GetProjectCandidatesUseCase =>
  async (projectId) => {
    try {
      clientLogger.info("GetProjectCandidatesUseCase: fetching all project candidates");

      const id = projectId ? ProjectId.create(projectId) : undefined;
      const candidates = await userRepository.findCandidatesForProject(id);

      clientLogger.info("GetProjectCandidatesUseCase: project candidates fetched successfully", {
        count: candidates.length,
      });

      return mapUsersToResponse(candidates);
    } catch (error) {
      clientLogger.error("GetProjectCandidatesUseCase: failed", { error, projectId });
      throw error;
    }
  };

export { createGetProjectCandidatesUseCase, type GetProjectCandidatesUseCase };
