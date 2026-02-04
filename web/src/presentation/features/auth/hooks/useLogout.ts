"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { logger } from "@/infrastructure/config/clientLogger";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
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
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => authRepository.logout(),
    onSuccess: () => {
      toast.success(successTexts.logoutSuccess);
      queryClient.resetQueries({ queryKey: [QUERY_KEYS.currentUser, QUERY_KEYS.auth] });
      router.replace(ROUTES.login);
    },
    onError: (error) => {
      logger.error("Logout error:", { logout: error });
    },
    retry: false,
  });
}
