"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AuthPayload } from "@/application/payloads";
import { logger } from "@/infrastructure/config/clientLogger";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { errorTexts, successTexts } from "@/shared/locales/messages";

/**
 * Custom hook for handling user sign-up functionality.
 *
 * @returns A mutation object from React Query that handles the sign-up process.
 *
 * @remarks
 * This hook utilizes the `authRepository.signUp` method to register a new user.
 * On successful sign-up, it displays a success toast message and redirects the user
 * to the sign-up confirmation page. On failure, it logs the error and displays
 * an error toast message.
 *
 * @example
 * ```tsx
 * const { mutate: signUp, isLoading } = useSignUp();
 *
 * const handleSubmit = (email: string, password: string) => {
 *   signUp({ email, password });
 * };
 * ```
 */
export function useSignUp() {
  const router = useRouter();
  const { signUp } = authRepository;

  return useMutation<void, Error, AuthPayload>({
    mutationFn: (payload) => signUp(payload.email, payload.password),
    onSuccess: (_, payload) => {
      toast.success(successTexts.signUpSuccessCheckEmail);
      router.push(ROUTES.signUpConfirm(payload.email));
    },
    onError: (error) => {
      logger.error("Failed to signup", { error });
      toast.error(errorTexts.somethingWentWrong);
    },
  });
}
