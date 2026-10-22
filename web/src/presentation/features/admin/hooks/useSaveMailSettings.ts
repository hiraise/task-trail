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
 * Connects mail or changes its settings (ADR-0017). The server saves them only if it connected
 * to SMTP, so wait up to 20 seconds for the response. Errors: `SECRET_REQUIRED`, re-enter the password;
 * `MAIL_CONNECTION_FAILED`, could not connect; `VALIDATION_FAILED`, fields in `details`.
 * Without the `password` field the saved password stays; `null` deletes it.
 */
export function useSaveMailSettings() {
  const queryClient = useQueryClient();

  return useMutation<ServiceSettings, Error, SaveMailSettingsPayload>({
    mutationFn: (settings) => adminRepository.saveMail(settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(QUERY_KEYS.admin.settings, settings);
      // Mail may have just been enabled: the web stops hiding the actions that need it
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.public });
      toast.success(adminTexts.mailSaved);
    },
    onError: (error) => {
      // Re-enter the password: the form shows this under the password field, no toast needed
      if (hasErrorCode(error, "SECRET_REQUIRED")) return;
      toastError(error, adminTexts.mailSaveFailed);
    },
  });
}
