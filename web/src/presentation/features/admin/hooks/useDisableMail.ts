import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ServiceSettings } from "@/domain/models/ServiceSettings";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { adminTexts } from "@/shared/locales/admin";

/** Отключает почту: настройки SMTP и пароль удаляются (ADR-0017). */
export function useDisableMail() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => adminRepository.disableMail(),
    onSuccess: () => {
      // Сервер отвечает без тела (204) — убираем почту из настроек сами
      queryClient.setQueryData<ServiceSettings>(QUERY_KEYS.admin.settings, (settings) =>
        settings ? { ...settings, mail: undefined } : settings,
      );
      // Без почты веб прячет восстановление пароля по почте и шлёт ссылки приглашений в ответе
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.public });
      toast.success(adminTexts.mailDisabled);
    },
    onError: (error) => toastError(error, adminTexts.mailDisableFailed),
  });
}
