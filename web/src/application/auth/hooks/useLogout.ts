import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { clientLogger } from "@/infrastructure/config/clientLogger";
import { ROUTES } from "@/infrastructure/config/routes";
import { successTexts } from "@/shared/locales/messages";
import { authService } from "@/infrastructure/api/authService";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: authService.logout,
    onSuccess: () => {
      toast.success(successTexts.logoutSuccess);
      queryClient.removeQueries({ queryKey: QUERY_KEYS.user });
      router.replace(ROUTES.login);
    },
    onError: (error) => {
      clientLogger.error("Logout error:", { logout: error });
    },
  });
};
