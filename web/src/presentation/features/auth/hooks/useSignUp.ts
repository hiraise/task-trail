import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { FirstAccountPayload } from "@/application/payloads";
import type { CurrentUser } from "@/domain/models/User";
import { authRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { errorMessage, toastError } from "@/shared/errors/errorMessage";
import { hasErrorCode } from "@/shared/errors/types";
import { errorTexts, successTexts } from "@/shared/locales/messages";
import { currentServiceUrl } from "@/shared/utils/serviceUrl";

/**
 * Registration of the first account, which is also the service administrator (ADR-0016). The service URL
 * is the one the web is opened from; the administrator can change it in the settings (ADR-0015).
 */
export function useSignUp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation<CurrentUser, Error, FirstAccountPayload>({
    mutationFn: (payload) =>
      authRepository.registerFirstAccount({ ...payload, serviceUrl: currentServiceUrl() }),
    onSuccess: (user) => {
      toast.success(successTexts.firstAccountCreated);
      queryClient.removeQueries({ queryKey: QUERY_KEYS.auth.session });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.settings.public });
      queryClient.setQueryData(QUERY_KEYS.user.current, user);
      navigate({ to: ROUTES.projects, replace: true });
    },
    onError: (error) => {
      // Someone has already created the first account: registration is closed, only sign-in is left
      if (hasErrorCode(error, "REGISTRATION_CLOSED")) {
        toast.error(errorMessage(error, errorTexts.somethingWentWrong));
        queryClient.removeQueries({ queryKey: QUERY_KEYS.settings.public });
        navigate({ to: ROUTES.login, replace: true });

        return;
      }
      toastError(error, errorTexts.somethingWentWrong);
    },
  });
}
