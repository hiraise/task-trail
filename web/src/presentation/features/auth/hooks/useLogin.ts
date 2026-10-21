import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const { from = ROUTES.projects } = useSearch({ from: "/auth/" });

  const queryClient = useQueryClient();
  const { login } = authRepository;

  return useMutation<void, Error, AuthPayload>({
    mutationFn: (payload) => login(payload.email, payload.password),
    onSuccess: () => {
      toast.success(successTexts.loginSuccess);
      // Remove cached auth data so beforeLoad guard fetches fresh state on navigation
      queryClient.removeQueries({ queryKey: QUERY_KEYS.auth.session });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.user.current });
      navigate({ to: from, replace: true });
    },
    onError: (error) => {
      logger.error("Login error:", { error });
      toast.error(errorTexts.somethingWentWrong);
    },
  });
}
