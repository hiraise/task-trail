"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ChangePasswordPayload } from "@/application/payloads";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";

/**
 * Custom hook to handle password change functionality.
 *
 * Utilizes a mutation to execute the password change use case.
 * On successful password change, navigates back and displays a success toast.
 * On error, logs the error and displays an error toast notification.
 *
 * @returns {UseMutationResult<void, Error, ChangePasswordPayload>} Mutation result object for password change.
 */
export function useChangePassword(): UseMutationResult<void, Error, ChangePasswordPayload> {
  const router = useRouter();
  const { changePassword } = appContainer.getUsecases().auth;

  return useMutation({
    mutationFn: (payload) => changePassword.execute(payload),
    onSuccess: () => {
      router.back();
      toast.success("Пароль успешно изменен");
    },
    onError: (error) => {
      clientLogger.error("usePasswordChange error:", { login: error });
      toast.error("Не удалось изменить пароль. Пожалуйста, попробуйте еще раз.");
    },
  });
}
