import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ServiceSettings } from "@/domain/models/ServiceSettings";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { adminTexts } from "@/shared/locales/admin";

/** Disables mail: SMTP settings and the password are deleted (ADR-0017). */
export function useDisableMail() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => adminRepository.disableMail(),
    onSuccess: () => {
      // The server responds without a body (204), so remove mail from the settings ourselves
      queryClient.setQueryData<ServiceSettings>(QUERY_KEYS.admin.settings, (settings) =>
        settings ? { ...settings, mail: undefined } : settings,
      );
      // Without mail the web hides password recovery by email and gets invitation links in the response
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.public });
      toast.success(adminTexts.mailDisabled);
    },
    onError: (error) => toastError(error, adminTexts.mailDisableFailed),
  });
}
