import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UpdateServiceUrlPayload } from "@/application/payloads";
import type { ServiceSettings } from "@/domain/models/ServiceSettings";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { adminTexts } from "@/shared/locales/admin";

/**
 * Service URL: links in emails and invitations are built from it (ADR-0015). The server strips
 * a trailing `/` and responds with all settings; those are shown.
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
