import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { AcceptInvitationPayload } from "@/application/payloads";
import type { CurrentUser } from "@/domain/models/User";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { errorMessage, toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { errorTexts, successTexts } from "@/shared/locales/messages";

/** Принять приглашение: аккаунт создаётся и сразу входит (ADR-0016). */
export function useAcceptInvitation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<CurrentUser, Error, AcceptInvitationPayload>({
    mutationFn: (payload) => authRepository.acceptInvitation(payload),
    onSuccess: (user) => {
      toast.success(successTexts.invitationAccepted);
      queryClient.removeQueries({ queryKey: QUERY_KEYS.auth.session });
      queryClient.setQueryData(QUERY_KEYS.user.current, user);
      navigate({ to: ROUTES.projects, replace: true });
    },
    onError: (error) => {
      // Аккаунт уже создан, например по этой же ссылке в другой вкладке, — дальше только вход
      if (hasErrorCode(error, "INVITATION_ACCEPTED")) {
        toast.error(errorMessage(error, errorTexts.somethingWentWrong));
        navigate({ to: ROUTES.login, replace: true });

        return;
      }
      toastError(error, errorTexts.somethingWentWrong);
    },
  });
}
