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
 * A password reset email to a user, with the same request as "Forgot password" on sign-in:
 * with mail the administrator does not need to hand over the link personally (ADR-0017). Email not sent:
 * suggest issuing a link from the same menu.
 */
export function useSendPasswordResetMail() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, EmailPayload>({
    mutationFn: ({ email }) => authRepository.forgotPassword(email),
    onSuccess: (_, { email }) => {
      toast.success(interpolate(adminTexts.resetMailSent, { email }));
    },
    onError: (error) => {
      // Mail was disabled meanwhile: refetch the settings, the menu will show only the link
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
