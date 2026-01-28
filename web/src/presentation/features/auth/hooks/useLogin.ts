"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { AuthPayload } from "@/application/payloads";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { appContainer } from "@/infrastructure/di/container";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { errorTexts, successTexts } from "@/shared/locales/messages";

/**
 * Hook for handling user login mutation.
 *
 * Manages the login process including:
 * - Executing the login use case with provided credentials
 * - Invalidating auth and current user queries on successful login
 * - Redirecting to the intended route or projects page after login
 * - Displaying success/error notifications
 * - Logging errors to the client logger
 *
 * @returns {UseMutationResult<void, Error, AuthPayload>} Mutation result object with login mutation state and handlers
 *
 * @example
 * const loginMutation = useLogin();
 * await loginMutation.mutate({ email: 'user@example.com', password: 'password' });
 */
export function useLogin(): UseMutationResult<void, Error, AuthPayload> {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || ROUTES.projects;

  const queryClient = useQueryClient();
  const { login } = appContainer.usecases.auth;

  return useMutation({
    mutationFn: (payload) => login(payload),
    onSuccess: () => {
      toast.success(successTexts.loginSuccess);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
      router.replace(from);
    },
    onError: (error) => {
      clientLogger.error("Login error:", { error });
      toast.error(errorTexts.somethingWentWrong);
    },
  });
}
