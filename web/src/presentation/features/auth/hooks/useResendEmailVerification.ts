"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { EmailPayload } from "@/application/payloads";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";

/**
 * Custom hook to resend the email verification link.
 *
 * Utilizes a mutation to execute the resend email verification use case.
 * On success, navigates to the sign-up confirmation page with the provided email.
 * On error, logs the error and displays a toast notification.
 *
 * @returns {UseMutationResult<string, Error, EmailPayload>}
 *   The mutation result object for resending email verification.
 */
export function useResendEmailVerification(): UseMutationResult<string, Error, EmailPayload> {
  const router = useRouter();
  const { resendEmailVerification } = appContainer.getUsecases().auth;

  return useMutation({
    mutationFn: (payload) => resendEmailVerification.execute(payload),
    onSuccess: (email) => router.push(ROUTES.signUpConfirm(email)),
    onError: (error) => {
      clientLogger.error("Failed to resend verification", { error });
      toast.error(error.message ?? "Не удалось отправить письмо с подтверждением");
    },
  });
}
