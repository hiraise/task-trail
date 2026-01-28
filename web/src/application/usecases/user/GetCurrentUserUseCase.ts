import type { UserResponseDto } from "@/application/dto/UserResponseDto";
import { mapUserToResponse } from "@/application/dto/UserResponseDto";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type GetCurrentUserUseCase = () => Promise<UserResponseDto | null>;

/**
 * Creates a use case function for retrieving the currently authenticated user.
 *
 * @param userRepository - The user repository instance used to fetch user data
 * @returns An async function that retrieves the current user and returns their data as a DTO,
 *          or null if no authenticated user is found
 * @throws {AppError} If the user retrieval fails or an unexpected error occurs
 *
 * @example
 * ```typescript
 * const getCurrentUser = createGetCurrentUserUseCase(userRepository);
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log(user.email);
 * }
 * ```
 */
const createGetCurrentUserUseCase =
  (userRepository: UserRepository) => async (): Promise<UserResponseDto | null> => {
    try {
      clientLogger.info("GetCurrentUserUseCase: starting execution");

      const currentUser = await userRepository.getCurrentUser();

      if (!currentUser) {
        clientLogger.warn("GetCurrentUserUseCase: no authenticated user found");
        return null;
      }

      clientLogger.info("GetCurrentUserUseCase: user retrieved successfully", {
        userId: currentUser.id.value,
        email: currentUser.email,
      });

      return mapUserToResponse(currentUser);
    } catch (error) {
      clientLogger.error("GetCurrentUserUseCase: execution failed", { error });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(AppErrorType.UNKNOWN, "Failed to retrieve current user information");
    }
  };

export { createGetCurrentUserUseCase, type GetCurrentUserUseCase };
