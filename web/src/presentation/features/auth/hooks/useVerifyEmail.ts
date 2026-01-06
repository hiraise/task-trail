"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { VerifyEmailPayload } from "@/application/payloads";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";

/**
 * A custom hook that handles the email verification process.
 *
 * This hook utilizes a mutation to verify the user's email address.
 * On successful verification, it redirects the user to the login page
 * and displays a success message. In case of an error, it logs the error
 * and shows an error message to the user.
 *
 * @returns {UseMutationResult<void, Error, VerifyEmailPayload>} The mutation result containing the status of the email verification process.
 */
export function useVerifyEmail(): UseMutationResult<void, Error, VerifyEmailPayload> {
  const router = useRouter();
  const { verifyEmail } = appContainer.getUsecases().auth;

  return useMutation({
    mutationFn: (payload) => verifyEmail.execute(payload),
    onSuccess: () => {
      router.push(ROUTES.login);
      toast.success("Email успешно подтвержден. Теперь вы можете войти в систему");
    },
    onError: (error) => {
      clientLogger.error("Failed to confirm email", { error });
      toast.error("Что-то пошло не так. Пожалуйста попробуйте еще раз.");
    },
  });
}
