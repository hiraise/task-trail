import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { clientLogger } from "@/infrastructure/config/clientLogger";
import { ChangePasswordPayload } from "@/domain/auth/auth.payload";
import { authService } from "@/infrastructure/api/authService";

export const usePasswordChange = () => {
  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: authService.changePassword,
    onSuccess: () => toast.success("Пароль успешно изменен"),
    onError: (error) => {
      clientLogger.error("usePasswordChange error:", { login: error });
      toast.error("Не удалось изменить пароль. Пожалуйста, попробуйте еще раз.");
    },
  });
};
