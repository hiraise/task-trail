import type { UploadAvatarPayload } from "@/application/payloads";
import { logger } from "@/infrastructure/config/clientLogger";
import { userRepository } from "@/infrastructure/repositories";
import { AppError, AppErrorType } from "@/shared/errors/types";

const createFormDataFromFile = (file: File): FormData => {
  const formData = new FormData();

  formData.append("file", file, file.name);

  return formData;
};

const validateAvatarFile = (file: File): void => {
  const MAX_SIZE = 5 * 1024 * 1024;
  const MIN_SIZE = 1024;
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (file.size > MAX_SIZE) {
    throw new AppError(
      AppErrorType.VALIDATION,
      `File size too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB`,
    );
  }

  if (!allowedTypes.includes(file.type)) {
    throw new AppError(
      AppErrorType.VALIDATION,
      `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    );
  }

  if (file.size < MIN_SIZE) {
    throw new AppError(AppErrorType.VALIDATION, "File is too small. Please upload a valid image");
  }
};

export async function uploadAvatarUseCase(payload: UploadAvatarPayload): Promise<string | null> {
  validateAvatarFile(payload.avatarFile);
  const formData = createFormDataFromFile(payload.avatarFile);

  try {
    return await userRepository.uploadAvatar(formData);
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (process.env.NODE_ENV !== "production") {
      logger.error("Upload avatar failed:", { error });
    }

    throw new AppError(AppErrorType.UNKNOWN, "Failed to upload avatar");
  }
}
