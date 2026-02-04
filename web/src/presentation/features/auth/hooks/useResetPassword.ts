"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ResetPasswordPayload } from "@/application/payloads";
import { logger } from "@/infrastructure/config/clientLogger";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";

/**
 * Custom hook for handling password reset functionality.
 *
 * Uses React Query's `useMutation` to manage the password reset process,
 * including success and error handling with toast notifications.
 *
 * @returns A mutation object from React Query that can be used to trigger
 * the password reset operation with `mutate` or `mutateAsync` methods.
 *
 * @example
 * ```tsx
 * const resetPasswordMutation = useResetPassword();
 *
 * const handleSubmit = (token: string, password: string) => {
 *   resetPasswordMutation.mutate({ token, password });
 * };
 * ```
 */
export function useResetPassword() {
  const router = useRouter();
  const { resetPassword } = authRepository;

  return useMutation<void, Error, ResetPasswordPayload>({
    mutationFn: (payload) => resetPassword(payload.token, payload.password),
    onSuccess: () => {
      toast.success("Пароль успешно изменен");
      router.replace(ROUTES.login);
    },
    onError: (error) => {
      logger.error("Ошибка при сбросе пароля:", { error });
      toast.error("Не удалось изменить пароль. Пожалуйста, попробуйте еще раз.");
    },
  });
}
