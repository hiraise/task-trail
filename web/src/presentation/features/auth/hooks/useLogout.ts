import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { logger } from "@/infrastructure/config/clientLogger";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { successTexts } from "@/shared/locales/messages";

/**
 * Custom hook that provides a mutation for logging out a user.
 *
 * This hook uses `useMutation` from React Query to handle the logout process.
 * On successful logout, it displays a success toast message, resets specific query keys
 * in the query client, and redirects the user to the login page.
 * If an error occurs during the logout process, it logs the error.
 *
 * @returns A mutation object from `useMutation` configured for the logout process.
 *
 * @example
 * const logoutMutation = useLogout();
 *
 * // Trigger the logout mutation
 * logoutMutation.mutate();
 */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => authRepository.logout(),
    onSuccess: async () => {
      toast.success(successTexts.logoutSuccess);
      // The cache holds this user's data: the next sign-in, possibly of another user, starts clean
      queryClient.clear();
      navigate({ to: ROUTES.login, replace: true });
    },
    onError: (error) => {
      logger.error("Logout error:", { logout: error });
    },
    retry: false,
  });
}
