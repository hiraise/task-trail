import type { UploadAvatarPayload } from "@/application/payloads";
import type { CurrentUser } from "@/domain/models/User";
import { userRepository } from "@/infrastructure/repositories";
import { AppError, AppErrorType } from "@/shared/errors/types";

// Те же пределы, что у сервера (uploadAvatar в контракте, ADR-0013): проверяем до загрузки,
// чтобы не гонять 5 МБ ради отказа. Тип сервер определяет по содержимому — здесь по расширению.
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
