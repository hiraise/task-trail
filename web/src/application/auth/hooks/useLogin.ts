import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorTexts, successTexts } from "@/shared/locales/messages";
import { ROUTES } from "@/infrastructure/config/routes";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AuthPayload } from "@/domain/auth/auth.payload";
import { authService } from "@/infrastructure/api/authService";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export const useLogin = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || ROUTES.dashboard;

  const queryClient = useQueryClient();

  return useMutation<void, Error, AuthPayload>({
    mutationFn: authService.login,
    onSuccess: () => {
      toast.success(successTexts.loginSuccess);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user });
      router.replace(from);
    },
    onError: (error) => {
      clientLogger.error("Login error:", { error });
      toast.error(errorTexts.somethingWentWrong);
    },
  });
};
