import type { UploadAvatarPayload } from "@/application/payloads";
import type { CurrentUser } from "@/domain/models/User";
import { userRepository } from "@/infrastructure/repositories";
import { AppError, AppErrorType } from "@/shared/errors/types";

// Same limits as the server (uploadAvatar in the contract, ADR-0013): checked before uploading
// so we don't send 5 MB just to be rejected. The server detects the type by content; here — by extension.
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const validateAvatarFile = (file: File): void => {
  if (file.size > MAX_SIZE) {
    throw new AppError(AppErrorType.VALIDATION, "avatar is larger than 5 MB", {
      code: "FILE_TOO_LARGE",
    });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError(AppErrorType.VALIDATION, `avatar type ${file.type} is not allowed`, {
      code: "FILE_TYPE_NOT_ALLOWED",
    });
  }
};

export async function uploadAvatarUseCase(payload: UploadAvatarPayload): Promise<CurrentUser> {
  validateAvatarFile(payload.avatarFile);

  return userRepository.uploadAvatar(payload.avatarFile);
}
