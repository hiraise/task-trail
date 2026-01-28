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
 * Custom hook to handle password recovery via email.
 *
 * Uses a mutation to execute the password recovery use case, sending a recovery email to the provided address.
 * On success, navigates to the password recovery confirmation page.
 * On error, logs the error and displays a toast notification to the user.
 *
 * @returns {UseMutationResult<string, Error, EmailPayload>} Mutation result object for password recovery.
 */
export function useRecoveryPassword(): UseMutationResult<string, Error, EmailPayload> {
  const router = useRouter();
  const { recoveryPassword } = appContainer.usecases.auth;

  return useMutation({
    mutationFn: (email) => recoveryPassword(email),
    onSuccess: (email) => router.push(ROUTES.passwordRecoveryConfirm(email)),
    onError: (error) => {
      clientLogger.error("Password recovery error", { error });
      toast.error("Failed to send email. Please try again.");
    },
  });
}
