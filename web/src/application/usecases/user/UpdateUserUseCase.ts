import type { UpdateUserPayload } from "@/application/payloads";
import type { User } from "@/domain/models/User";
import { createUser } from "@/domain/models/User";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type UpdateUserUseCase = (payload: UpdateUserPayload) => Promise<User>;

/**
 * Use case for updating user profile information.
 *
 * This use case handles the business logic for user profile updates,
 * including validation of update data and coordination with the repository.
 */
const createUpdateUserUseCase =
  (userRepository: UserRepository): UpdateUserUseCase =>
  async (payload) => {
    try {
      clientLogger.info("UpdateUserUseCase: starting execution");

      // Delegate to repository for the update
      const updatedUser = await userRepository.updateUser(payload.username);

      clientLogger.info("UpdateUserUseCase: user updated successfully", {
        userId: updatedUser.id,
        updatedFields: Object.keys(payload),
      });

      return createUser(updatedUser);
    } catch (error) {
      clientLogger.error("UpdateUserUseCase: execution failed", { error });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(AppErrorType.UNKNOWN, "Failed to update user profile");
    }
  };

export { createUpdateUserUseCase, type UpdateUserUseCase };
