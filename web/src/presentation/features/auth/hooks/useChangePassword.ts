import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangePasswordPayload } from "@/application/payloads";
import { authRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { authTexts } from "@/shared/locales/auth";

/**
 * Смена пароля вошедшим пользователем. Куда идти после успеха, решает экран: на десктопе форма
 * стоит в профиле, на телефоне — отдельной страницей. `WRONG_PASSWORD` и `PASSWORD_SAME_AS_OLD`
 * приходят текстом из shared/locales/apiErrors.ts.
 */
export function useChangePassword() {
  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: (payload) => authRepository.changePassword(payload.oldPassword, payload.newPassword),
    onSuccess: () => {
      toast.success(authTexts.passwordChanged);
    },
    onError: (error) => toastError(error, authTexts.changePasswordFailed),
  });
}
