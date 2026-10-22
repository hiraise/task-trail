import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { adminTexts } from "@/shared/locales/admin";

/**
 * A test email to the administrator's address (ADR-0017); wait up to 20 seconds for the response. The
 * `MAIL_DISABLED` and `MAIL_SEND_FAILED` texts in apiErrors.ts address the person resetting a password,
 * so the administrator gets their own.
 */
export function useSendTestMail() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => adminRepository.sendTestMail(),
    onSuccess: () => {
      toast.success(adminTexts.testMailSent);
    },
    onError: (error) => {
      // Mail was disabled meanwhile, e.g. in another tab: show the settings as they are
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
