import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UpdateServiceUrlPayload } from "@/application/payloads";
import type { ServiceSettings } from "@/domain/models/ServiceSettings";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { adminTexts } from "@/shared/locales/admin";

/**
 * Адрес сервиса: от него строятся ссылки в письмах и приглашениях (ADR-0015). Сервер отбрасывает
 * `/` в конце и отвечает настройками целиком — их и показываем.
 */
export function useUpdateServiceUrl() {
  const queryClient = useQueryClient();

  return useMutation<ServiceSettings, Error, UpdateServiceUrlPayload>({
    mutationFn: ({ serviceUrl }) => adminRepository.updateServiceUrl(serviceUrl),
    onSuccess: (settings) => {
      queryClient.setQueryData(QUERY_KEYS.admin.settings, settings);
      toast.success(adminTexts.serviceUrlSaved);
    },
    onError: (error) => toastError(error, adminTexts.serviceUrlSaveFailed),
  });
}
