import type { UserResponseDto} from "@/application/dto/UserResponseDto";
import { UserResponseMapper } from "@/application/dto/UserResponseDto";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

/**
 * Use case for retrieving the current authenticated user.
 *
 * This use case encapsulates the business logic for fetching
 * the current user's information and transforming it to the
 * appropriate DTO format for the presentation layer.
 */
export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Executes the use case to get the current authenticated user.
   *
   * @returns {Promise<UserResponseDto | null>} The current user's data as DTO,
   * or null if no user is authenticated.
   * @throws {AppError} If the operation fails due to server or network issues.
   */
  async execute(): Promise<UserResponseDto | null> {
    try {
      clientLogger.info("GetCurrentUserUseCase: starting execution");

      const currentUser = await this.userRepository.getCurrentUser();

      if (!currentUser) {
        clientLogger.warn("GetCurrentUserUseCase: no authenticated user found");
        return null;
      }

      clientLogger.info("GetCurrentUserUseCase: user retrieved successfully", {
        userId: currentUser.id.value,
        email: currentUser.email,
      });

      return UserResponseMapper.fromDomain(currentUser);
    } catch (error) {
      clientLogger.error("GetCurrentUserUseCase: execution failed", { error });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(AppErrorType.UNKNOWN, "Failed to retrieve current user information");
    }
  }
}
