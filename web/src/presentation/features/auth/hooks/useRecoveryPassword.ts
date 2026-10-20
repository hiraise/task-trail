import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { EmailPayload } from "@/application/payloads";
import { logger } from "@/infrastructure/config/clientLogger";
import { authRepository } from "@/infrastructure/repositories";

/**
 * Custom hook to handle the password recovery process.
 *
 * This hook provides a mutation that allows users to initiate the password recovery process
 * by sending a recovery email. It handles the mutation logic, including success and error
 * scenarios, and integrates with the router for navigation.
 *
 * @returns A mutation object from `useMutation` with the following properties:
 * - `mutate`: Function to trigger the password recovery process.
 * - `isLoading`: Boolean indicating if the mutation is in progress.
 * - `isError`: Boolean indicating if the mutation resulted in an error.
 * - `isSuccess`: Boolean indicating if the mutation was successful.
 * - `error`: The error object if the mutation failed.
 *
 * @example
 * const { mutate, isLoading, isError, isSuccess } = useRecoveryPassword();
 *
 * const handlePasswordRecovery = () => {
 *   mutate({ email: "user@example.com" });
 * };
 *
 * @remarks
 * - On success, the user is redirected to the password recovery confirmation page.
 * - On error, an error message is logged and a toast notification is displayed.
 */
export function useRecoveryPassword() {
  const navigate = useNavigate();
  const { forgotPassword } = authRepository;

  return useMutation<string, Error, EmailPayload>({
    mutationFn: (payload) => forgotPassword(payload.email),
    onSuccess: (email) => navigate({ to: "/auth/password-recovery/confirm", params: { email } }),
    onError: (error) => {
      logger.error("Password recovery error", { error });
      toast.error("Failed to send email. Please try again.");
    },
  });
}
