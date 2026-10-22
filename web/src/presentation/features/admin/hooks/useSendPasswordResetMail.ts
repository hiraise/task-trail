import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { EmailPayload } from "@/application/payloads";
import { authRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { adminTexts } from "@/shared/locales/admin";
import { interpolate } from "@/shared/utils/interpolate";

/**
 * Письмо со ссылкой сброса пароля пользователю — тем же запросом, что «Забыли пароль» на входе:
 * с почтой администратору не нужно передавать ссылку самому (ADR-0017). Письмо не ушло —
 * подсказываем выдать ссылку из того же меню.
 */
export function useSendPasswordResetMail() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, EmailPayload>({
    mutationFn: ({ email }) => authRepository.forgotPassword(email),
    onSuccess: (_, { email }) => {
      toast.success(interpolate(adminTexts.resetMailSent, { email }));
    },
    onError: (error) => {
      // Почту успели отключить — перечитываем настройки, меню покажет только ссылку
      if (hasErrorCode(error, "MAIL_DISABLED")) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.settings });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.public });
        toast.error(adminTexts.resetMailNoMail);

        return;
      }
      if (hasErrorCode(error, "MAIL_SEND_FAILED")) {
        toast.error(adminTexts.resetMailRejected);

        return;
      }
      toastError(error, adminTexts.resetMailFailed);
    },
  });
}
