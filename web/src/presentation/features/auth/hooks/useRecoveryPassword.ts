import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { EmailPayload } from "@/application/payloads";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { authTexts } from "@/shared/locales/auth";

/**
 * Письмо со ссылкой сброса пароля. Без почты сервер отвечает `MAIL_DISABLED` — тогда
 * перечитываем публичные настройки, и экран показывает, что ссылку выдаёт администратор.
 */
export function useRecoveryPassword(options: { navigateOnSuccess?: boolean } = {}) {
  const { navigateOnSuccess = true } = options;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<void, Error, EmailPayload>({
    mutationFn: (payload) => authRepository.forgotPassword(payload.email),
    onSuccess: (_, { email }) => {
      if (navigateOnSuccess) navigate({ to: ROUTES.passwordRecoveryConfirm, search: { email } });
    },
    onError: (error) => {
      if (hasErrorCode(error, "MAIL_DISABLED")) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.public });
      }
      toastError(error, authTexts.sendEmailFailed);
    },
  });
}
