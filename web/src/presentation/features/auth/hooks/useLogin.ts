"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { AuthPayload } from "@/application/payloads";
import { logger } from "@/infrastructure/config/clientLogger";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { errorTexts, successTexts } from "@/shared/locales/messages";

/**
 * Custom hook that handles user login functionality.
 *
 * @returns A mutation object from React Query that manages the login process.
 *
 * @remarks
 * This hook utilizes React Query's `useMutation` to handle the login flow.
 * On successful login:
 * - Displays a success toast notification
 * - Invalidates auth and currentUser queries to refetch user data
 * - Redirects the user to the previous page (from search params) or to the projects route
 *
 * On error:
 * - Logs the error using the logger
 * - Displays an error toast notification
 *
 * @example
 * ```tsx
 * const { mutate: login, isPending } = useLogin();
 *
 * const handleSubmit = (data: AuthPayload) => {
 *   login(data);
 * };
 * ```
 */
export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || ROUTES.projects;

  const queryClient = useQueryClient();
  const { login } = authRepository;

  return useMutation<void, Error, AuthPayload>({
    mutationFn: (payload) => login(payload.email, payload.password),
    onSuccess: () => {
      toast.success(successTexts.loginSuccess);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
      router.replace(from);
    },
    onError: (error) => {
      logger.error("Login error:", { error });
      toast.error(errorTexts.somethingWentWrong);
    },
  });
}
