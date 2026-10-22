import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";

import type { AuthPayload } from "@/application/payloads";
import type { CurrentUser } from "@/domain/models/User";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { errorTexts, successTexts } from "@/shared/locales/messages";

/**
 * Sign-in. After it, go to the page from which route protection sent to sign-in (`from`),
 * otherwise to projects.
 */
export function useLogin() {
  const navigate = useNavigate();
  const { from = ROUTES.projects } = useSearch({ from: "/auth/" });
  const queryClient = useQueryClient();

  return useMutation<CurrentUser, Error, AuthPayload>({
    mutationFn: (payload) => authRepository.login(payload.email, payload.password),
    onSuccess: (user) => {
      toast.success(successTexts.loginSuccess);
      // Route protection will refetch the sign-in state, and the current user is already known
      queryClient.removeQueries({ queryKey: QUERY_KEYS.auth.session });
      queryClient.setQueryData(QUERY_KEYS.user.current, user);
      navigate({ to: from, replace: true });
    },
    onError: (error) => toastError(error, errorTexts.somethingWentWrong),
  });
}
