"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AuthPayload } from "@/application/payloads";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { errorTexts, successTexts } from "@/shared/locales/messages";

/**
 * Custom hook for handling user sign-up.
 *
 * This hook utilizes a mutation to execute the sign-up process.
 * On successful sign-up, it displays a success message and redirects
 * the user to the confirmation page. In case of an error, it logs
 * the error and displays an error message.
 *
 * @returns {UseMutationResult<void, Error, AuthPayload>} The mutation result containing
 * the status of the sign-up operation and methods to trigger the mutation.
 */
export function useSignUp(): UseMutationResult<void, Error, AuthPayload> {
  const router = useRouter();
  const { signUp } = appContainer.usecases.auth;

  return useMutation({
    mutationFn: (payload) => signUp(payload),
    onSuccess: (_, payload) => {
      toast.success(successTexts.signUpSuccessCheckEmail);
      router.push(ROUTES.signUpConfirm(payload.email));
    },
    onError: (error) => {
      clientLogger.error("Failed to signup", { error });
      toast.error(errorTexts.somethingWentWrong);
    },
  });
}
