import { useMutation } from "@tanstack/react-query";

import type { PasswordResetLinkPayload } from "@/application/payloads";
import type { PasswordResetLink } from "@/domain/models/PasswordResetLink";
import { adminRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { adminTexts } from "@/shared/locales/admin";

/**
 * Ссылка сброса пароля для пользователя: администратор передаёт её сам, когда почта
 * не подключена (ADR-0017). Ссылку и срок показывает экран из ответа мутации.
 */
export function useCreatePasswordResetLink() {
  return useMutation<PasswordResetLink, Error, PasswordResetLinkPayload>({
    mutationFn: ({ userId }) => adminRepository.createPasswordResetLink(userId),
    onError: (error) => toastError(error, adminTexts.resetLinkFailed),
  });
}
