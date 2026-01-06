"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ResetPasswordPayload } from "@/application/payloads";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";

/**
 * Custom hook for handling password reset functionality.
 *
 * This hook utilizes a mutation to execute the password reset process.
 * On successful password reset, it displays a success message and redirects
 * the user to the login page. In case of an error, it logs the error and
 * displays an error message to the user.
 *
 * @returns {UseMutationResult<void, Error, ResetPasswordPayload>} The mutation result
 * containing the status of the password reset operation.
 */
export function useResetPassword(): UseMutationResult<void, Error, ResetPasswordPayload> {
  const router = useRouter();
  const { resetPassword } = appContainer.getUsecases().auth;

  return useMutation({
    mutationFn: (payload) => resetPassword.execute(payload),
    onSuccess: () => {
      toast.success("Пароль успешно изменен");
      router.replace(ROUTES.login);
    },
    onError: (error) => {
      clientLogger.error("usePasswordReset error:", { login: error });
      toast.error("Не удалось изменить пароль. Пожалуйста, попробуйте еще раз.");
    },
  });
}
