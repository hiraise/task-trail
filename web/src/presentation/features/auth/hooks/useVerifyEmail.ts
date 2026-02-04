"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { VerifyEmailPayload } from "@/application/payloads";
import { logger } from "@/infrastructure/config/clientLogger";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";

/**
 * A custom hook that provides functionality for verifying a user's email address.
 * It uses a mutation to handle the email verification process and provides success
 * and error handling with appropriate user feedback.
 *
 * @returns A mutation object from `useMutation` configured for email verification.
 *
 * @remarks
 * - On successful email verification, the user is redirected to the login page and
 *   a success toast message is displayed.
 * - On failure, an error is logged, and an error toast message is displayed to the user.
 *
 * @example
 * ```typescript
 * const verifyEmailMutation = useVerifyEmail();
 *
 * verifyEmailMutation.mutate({ token: "example-token" });
 * ```
 */
export function useVerifyEmail() {
  const router = useRouter();
  const { verifyEmail } = authRepository;

  return useMutation<void, Error, VerifyEmailPayload>({
    mutationFn: (payload) => verifyEmail(payload.token),
    onSuccess: () => {
      router.push(ROUTES.login);
      toast.success("Email успешно подтвержден. Теперь вы можете войти в систему");
    },
    onError: (error) => {
      logger.error("Failed to confirm email", { error });
      toast.error("Что-то пошло не так. Пожалуйста попробуйте еще раз.");
    },
  });
}
