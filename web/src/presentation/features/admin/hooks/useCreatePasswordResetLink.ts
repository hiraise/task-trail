import { useMutation } from "@tanstack/react-query";

import type { PasswordResetLinkPayload } from "@/application/payloads";
import type { PasswordResetLink } from "@/domain/models/PasswordResetLink";
import { adminRepository } from "@/infrastructure/repositories";
import { toastError } from "@/shared/errors/errorMessage";
import { adminTexts } from "@/shared/locales/admin";

/**
 * A password reset link for a user: the administrator hands it over personally when mail
 * is not connected (ADR-0017). The screen shows the link and its expiry from the mutation response.
 */
export function useCreatePasswordResetLink() {
  return useMutation<PasswordResetLink, Error, PasswordResetLinkPayload>({
    mutationFn: ({ userId }) => adminRepository.createPasswordResetLink(userId),
    onError: (error) => toastError(error, adminTexts.resetLinkFailed),
  });
}
