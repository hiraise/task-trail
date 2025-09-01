import { toast } from "sonner";

import { useMutation } from "@tanstack/react-query";
import { authService } from "@/infrastructure/api/authService";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export const useResendEmail = (email: string) => {
  return useMutation<void, Error, string>({
    mutationFn: authService.resendVerification,
    onSuccess: () =>
      toast.success(`Письмо с подтверждением отправлено на ${email}. Проверьте папку "Спам"`),
    onError: (error) => {
      clientLogger.error("Failed to resend verification", { error });
      toast.error(error.message ?? "Не удалось отправить письмо с подтверждением");
    },
  });
};
