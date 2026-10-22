import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ChangePasswordPayload } from "@/application/payloads";
import { authRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { authTexts } from "@/shared/locales/auth";

/**
 * Password change by a signed-in user. The screen decides where to go after success: on a desktop the form
 * is in the profile, on a phone it is a separate page. `WRONG_PASSWORD` and `PASSWORD_SAME_AS_OLD`
 * come as texts from shared/locales/apiErrors.ts.
 */
export function useChangePassword() {
  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: (payload) => authRepository.changePassword(payload.oldPassword, payload.newPassword),
    onSuccess: () => {
      toast.success(authTexts.passwordChanged);
    },
    onError: (error) => toastError(error, authTexts.changePasswordFailed),
  });
}
