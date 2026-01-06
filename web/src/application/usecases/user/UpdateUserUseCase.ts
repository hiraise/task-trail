import type { UpdateUserCommand } from "@/application/commands/user/UpdateUserCommand";
import type { UserResponseDto} from "@/application/dto/UserResponseDto";
import { UserResponseMapper } from "@/application/dto/UserResponseDto";
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

  /**
   * Executes the user profile update process.
   *
   * @param command - Command containing the data to update
   * @returns {Promise<UserResponseDto>} Updated user data as DTO
   * @throws {AppError} If validation fails or update operation fails
   */
  async execute(command: UpdateUserCommand): Promise<UserResponseDto> {
    try {
      clientLogger.info("UpdateUserUseCase: starting execution");

      // Business rule validation
      this.validateCommand(command);

      // Delegate to repository for the update
      const updatedUser = await this.userRepository.updateUser(command.username);

      clientLogger.info("UpdateUserUseCase: user updated successfully", {
        userId: updatedUser.id.value,
        updatedFields: Object.keys(command),
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

  /**
   * Validates command data according to business rules.
   *
   * @private
   * @param command - Command to validate
   * @throws {AppError} If validation fails
   */
  private validateCommand(command: UpdateUserCommand): void {
    if (!command || Object.keys(command).length === 0) {
      throw new AppError(AppErrorType.VALIDATION, "Update data cannot be empty");
    }

    // Business rule: Username validation
    if (command.username !== undefined) {
      this.validateUsername(command.username);
    }

    clientLogger.info("UpdateUserUseCase: validation passed", {
      fieldsToUpdate: Object.keys(command),
    });
  }

  /**
   * Validates username according to business rules.
   *
   * @private
   * @param username - Username to validate
   * @throws {AppError} If validation fails
   */
  private validateUsername(username: string | undefined): void {
    if (username !== null && username !== undefined) {
      // Allow empty string to clear username
      if (typeof username !== "string") {
        throw new AppError(AppErrorType.VALIDATION, "Username must be a string");
      }

      // Business rule: Username length constraints
      if (username.length > 50) {
        throw new AppError(AppErrorType.VALIDATION, "Username cannot exceed 50 characters");
      }

      // Business rule: Username format (if not empty)
      if (username.trim().length > 0) {
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username.trim())) {
          throw new AppError(
            AppErrorType.VALIDATION,
            "Username can only contain letters, numbers, underscores, and hyphens",
          );
        }
      }
    }
  }
}
