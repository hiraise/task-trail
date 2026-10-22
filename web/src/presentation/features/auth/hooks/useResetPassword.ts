import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { ResetPasswordPayload } from "@/application/payloads";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { toastError } from "@/shared/errors/errorMessage";
import { authTexts } from "@/shared/locales/auth";

/** A new password via a reset link. The reset ends all sessions; next comes sign-in (resetPassword). */
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation<void, Error, ResetPasswordPayload>({
    mutationFn: (payload) => authRepository.resetPassword(payload.token, payload.password),
    onSuccess: () => {
      toast.success(authTexts.passwordChanged);
      navigate({ to: ROUTES.login, replace: true });
    },
    onError: (error) => toastError(error, authTexts.changePasswordFailed),
  });
}
