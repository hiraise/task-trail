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
 * Вход. После входа — на страницу, с которой отправила на вход защита маршрутов (`from`),
 * иначе в проекты.
 */
export function useLogin() {
  const navigate = useNavigate();
  const { from = ROUTES.projects } = useSearch({ from: "/auth/" });
  const queryClient = useQueryClient();

  return useMutation<CurrentUser, Error, AuthPayload>({
    mutationFn: (payload) => authRepository.login(payload.email, payload.password),
    onSuccess: (user) => {
      toast.success(successTexts.loginSuccess);
      // Защита маршрутов перечитает состояние входа, а текущий пользователь уже известен
      queryClient.removeQueries({ queryKey: QUERY_KEYS.auth.session });
      queryClient.setQueryData(QUERY_KEYS.user.current, user);
      navigate({ to: from, replace: true });
    },
    onError: (error) => toastError(error, errorTexts.somethingWentWrong),
  });
}
