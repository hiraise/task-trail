"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { EmailPayload } from "@/application/payloads";
import { logger } from "@/infrastructure/config/clientLogger";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";

/**
 * Custom hook to handle the resend email verification functionality.
 *
 * This hook provides a mutation that allows resending a verification email
 * to a user. It uses the `useMutation` hook from React Query to manage the
 * mutation state and handle success and error scenarios.
 *
 * @returns A mutation object from `useMutation` with the following properties:
 * - `mutate`: A function to trigger the resend email verification mutation.
 * - `isLoading`: A boolean indicating if the mutation is in progress.
 * - `isError`: A boolean indicating if the mutation resulted in an error.
 * - `isSuccess`: A boolean indicating if the mutation was successful.
 * - `error`: The error object if the mutation failed.
 *
 * @example
 * ```typescript
 * const { mutate, isLoading, isError, isSuccess, error } = useResendEmailVerification();
 *
 * const handleResend = () => {
 *   mutate({ email: "user@example.com" });
 * };
 * ```
 *
 * @remarks
 * - On success, the user is redirected to the sign-up confirmation page.
 * - On error, an error message is logged and displayed to the user via a toast notification.
 */
export function useResendEmailVerification() {
  const router = useRouter();
  const { resendEmailVerification } = authRepository;

  return useMutation<string, Error, EmailPayload>({
    mutationFn: (payload) => resendEmailVerification(payload.email),
    onSuccess: (email) => router.push(ROUTES.signUpConfirm(email)),
    onError: (error) => {
      logger.error("Failed to resend verification", { error });
      toast.error(error.message ?? "Не удалось отправить письмо с подтверждением");
    },
  });
}
