import type { UploadAvatarCommand } from "@/application/commands/user/UploadAvatarCommand";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

/**
 * Use case for uploading a user's avatar.
 *
 * This use case encapsulates the business logic for avatar upload,
 * including validation of file constraints and coordination with
 * the repository layer for the actual upload operation.
 */
export class UploadAvatarUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Executes the avatar upload process.
   *
   * @param command - Command containing the avatar file to upload
   * @returns {Promise<string | null>} The new avatar URL or null if upload failed
   * @throws {AppError} If validation fails or upload operation fails
   */
  async execute(command: UploadAvatarCommand): Promise<string | null> {
    try {
      clientLogger.info("UploadAvatarUseCase: starting execution");

      // Business rule validation
      this.validateCommand(command);

      // Convert File to FormData for repository
      const formData = this.createFormDataFromFile(command.avatarFile);

      // Delegate to repository for technical upload
      const avatarUrl = await this.userRepository.uploadAvatar(formData);

      if (avatarUrl) {
        clientLogger.info("UploadAvatarUseCase: avatar uploaded successfully", {
          avatarUrl,
          fileName: command.avatarFile.name,
          fileSize: command.avatarFile.size,
        });
      } else {
        clientLogger.warn("UploadAvatarUseCase: upload completed but no URL returned");
      }

      return avatarUrl;
    } catch (error) {
      clientLogger.error("UploadAvatarUseCase: execution failed", { error });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(AppErrorType.UNKNOWN, "Failed to upload avatar");
    }
  }

  /**
   * Validates the command according to business rules.
   *
   * @private
   * @param command - Command to validate
   * @throws {AppError} If validation fails
   */
  private validateCommand(command: UploadAvatarCommand): void {
    if (!command.avatarFile) {
      throw new AppError(AppErrorType.VALIDATION, "Avatar file is required");
    }

    if (!(command.avatarFile instanceof File)) {
      throw new AppError(AppErrorType.VALIDATION, "Invalid file format - must be File");
    }

    this.validateAvatarFile(command.avatarFile);

    clientLogger.info("UploadAvatarUseCase: command validation passed", {
      fileName: command.avatarFile.name,
      fileSize: command.avatarFile.size,
      fileType: command.avatarFile.type,
    });
  }

  /**
   * Creates FormData from File for repository.
   *
   * @private
   * @param file - File to convert to FormData
   * @returns FormData ready for HTTP request
   */
  private createFormDataFromFile(file: File): FormData {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return formData;
  }

  /**
   * Validates the avatar file according to business rules.
   *
   * @private
   * @param file - File to validate
   * @throws {AppError} If validation fails
   */
  private validateAvatarFile(file: File): void {
    // Business rule: Maximum file size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new AppError(
        AppErrorType.VALIDATION,
        `File size too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`,
      );
    }

    // Business rule: Allowed file types
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new AppError(
        AppErrorType.VALIDATION,
        `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      );
    }

    // Business rule: Minimum file size (to prevent empty uploads)
    const MIN_SIZE = 1024; // 1KB
    if (file.size < MIN_SIZE) {
      throw new AppError(AppErrorType.VALIDATION, "File is too small. Please upload a valid image");
    }

    clientLogger.info("UploadAvatarUseCase: file validation passed", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  }
}
