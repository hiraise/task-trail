"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { successTexts } from "@/shared/locales/messages";

/**
 * Custom hook to handle user logout functionality.
 *
 * This hook provides a mutation that logs out the current user using the authentication repository.
 * On successful logout, it displays a success toast, resets relevant query caches, and redirects to the login page.
 * On error, it logs the error using the client logger.
 *
 * @returns {UseMutationResult<void, Error, void>} Mutation result object for logout operation.
 */
export function useLogout(): UseMutationResult<void, Error, void> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = appContainer.getRepositories().auth;

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast.success(successTexts.logoutSuccess);
      queryClient.resetQueries({ queryKey: [QUERY_KEYS.currentUser, QUERY_KEYS.auth] });
      router.replace(ROUTES.login);
    },
    onError: (error) => {
      clientLogger.error("Logout error:", { logout: error });
    },
    retry: false,
  });
}
