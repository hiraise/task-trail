import type { UserResponseDto} from "@/application/dto/UserResponseDto";
import { UserResponseMapper } from "@/application/dto/UserResponseDto";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";


export class GetProjectCandidatesUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(projectId?: string | number): Promise<UserResponseDto[]> {
    try {
      clientLogger.info("GetProjectCandidatesUseCase: fetching all project candidates");

      const id = projectId ? ProjectId.create(projectId) : undefined;
      const candidates = await this.userRepository.findCandidatesForProject(id);

      clientLogger.info("GetProjectCandidatesUseCase: project candidates fetched successfully", {
        count: candidates.length,
      });

      return UserResponseMapper.fromDomainList(candidates);
    } catch (error) {
      clientLogger.error("GetProjectCandidatesUseCase: failed", { error, projectId });
      throw error;
    }
  }
}
