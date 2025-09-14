import { useMutation } from "@tanstack/react-query";

import { authService } from "@/infrastructure/api/authService";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export const useEmailConfirm = () => {
  return useMutation<void, Error, string>({
    mutationFn: authService.confirmEmail,

    onError: (error) => {
      clientLogger.error("Failed to confirm email", { error });
    },
  });
};
