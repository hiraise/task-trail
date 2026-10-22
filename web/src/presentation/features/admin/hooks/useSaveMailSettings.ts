import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SaveMailSettingsPayload } from "@/application/payloads";
import type { ServiceSettings } from "@/domain/models/ServiceSettings";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { adminTexts } from "@/shared/locales/admin";

/**
 * Подключает почту или меняет её настройки (ADR-0017). Сервер сохраняет их, только если подключился
 * к SMTP, — ответ ждём до 20 секунд. Ошибки: `SECRET_REQUIRED` — пароль ввести заново,
 * `MAIL_CONNECTION_FAILED` — не подключился, `VALIDATION_FAILED` — поля в `details`.
 * Без поля `password` остаётся сохранённый пароль, `null` — удалить его.
 */
export function useSaveMailSettings() {
  const queryClient = useQueryClient();

  return useMutation<ServiceSettings, Error, SaveMailSettingsPayload>({
    mutationFn: (settings) => adminRepository.saveMail(settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(QUERY_KEYS.admin.settings, settings);
      // Почта могла только что включиться — веб перестанет прятать действия, которым она нужна
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.public });
      toast.success(adminTexts.mailSaved);
    },
    onError: (error) => {
      // Пароль ввести заново — форма показывает это под полем пароля, тост не нужен
      if (hasErrorCode(error, "SECRET_REQUIRED")) return;
      toastError(error, adminTexts.mailSaveFailed);
    },
  });
}
