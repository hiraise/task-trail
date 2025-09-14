import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { clientLogger } from "@/infrastructure/config/clientLogger";
import { PasswordResetPayload } from "@/domain/auth/auth.payload";
import { authService } from "@/infrastructure/api/authService";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/infrastructure/config/routes";

export const usePasswordReset = () => {
  const router = useRouter();

  return useMutation<void, Error, PasswordResetPayload>({
    mutationFn: authService.passwordReset,
    onSuccess: () => {
      toast.success("Пароль успешно изменен");
      router.replace(ROUTES.login);
    },
    onError: (error) => {
      clientLogger.error("usePasswordReset error:", { login: error });
      toast.error("Не удалось изменить пароль. Пожалуйста, попробуйте еще раз.");
    },
  });
};
