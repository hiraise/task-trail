import type { UserResponseDto } from "@/application/dto/UserResponseDto";
import { UserResponseMapper } from "@/application/dto/UserResponseDto";
import type { UpdateUserPayload } from "@/application/payloads";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

/**
 * Use case for updating user profile information.
 *
 * This use case handles the business logic for user profile updates,
 * including validation of update data and coordination with the repository.
 */
export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(payload: UpdateUserPayload): Promise<UserResponseDto> {
    try {
      clientLogger.info("UpdateUserUseCase: starting execution");

      // Delegate to repository for the update
      const updatedUser = await this.userRepository.updateUser(payload.username);

      clientLogger.info("UpdateUserUseCase: user updated successfully", {
        userId: updatedUser.id.value,
        updatedFields: Object.keys(payload),
      });

      return UserResponseMapper.fromDomain(updatedUser);
    } catch (error) {
      clientLogger.error("UpdateUserUseCase: execution failed", { error });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(AppErrorType.UNKNOWN, "Failed to update user profile");
    }
  }
}
