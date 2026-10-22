import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { adminTexts } from "@/shared/locales/admin";

/**
 * Тестовое письмо на почту администратора (ADR-0017); ответ ждём до 20 секунд. Тексты
 * `MAIL_DISABLED` и `MAIL_SEND_FAILED` в apiErrors.ts обращены к тому, кто сбрасывает пароль,
 * поэтому администратору — свои.
 */
export function useSendTestMail() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => adminRepository.sendTestMail(),
    onSuccess: () => {
      toast.success(adminTexts.testMailSent);
    },
    onError: (error) => {
      // Почту успели отключить, например в другой вкладке, — показываем настройки как есть
      if (hasErrorCode(error, "MAIL_DISABLED")) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.settings });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.public });
        toast.error(adminTexts.testMailNoMail);

        return;
      }
      if (hasErrorCode(error, "MAIL_SEND_FAILED")) {
        toast.error(adminTexts.testMailRejected);

        return;
      }
      toastError(error, adminTexts.testMailFailed);
    },
  });
}
