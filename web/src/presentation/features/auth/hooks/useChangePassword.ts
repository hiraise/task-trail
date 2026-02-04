"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ChangePasswordPayload } from "@/application/payloads";
import { logger } from "@/infrastructure/config/clientLogger";
import { authRepository } from "@/infrastructure/repositories";

/**
 * Custom hook for handling password change functionality.
 *
 * Uses React Query's `useMutation` to manage the password change process,
 * including success and error handling with toast notifications.
 *
 * @returns A mutation object from `useMutation` that can be used to trigger
 * the password change operation with `mutate` or `mutateAsync`.
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useChangePassword();
 *
 * const handleSubmit = (oldPassword: string, newPassword: string) => {
 *   mutate({ oldPassword, newPassword });
 * };
 * ```
 */
export function useChangePassword() {
  const router = useRouter();
  const { changePassword } = authRepository;

  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: (payload) => changePassword(payload.oldPassword, payload.newPassword),
    onSuccess: () => {
      router.back();
      toast.success("Пароль успешно изменен");
    },
    onError: (error) => {
      logger.error("usePasswordChange error:", { login: error });
      toast.error("Не удалось изменить пароль. Пожалуйста, попробуйте еще раз.");
    },
  });
}
