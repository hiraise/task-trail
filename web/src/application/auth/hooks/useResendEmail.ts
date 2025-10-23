import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { clientLogger } from "@/infrastructure/config/clientLogger";
import { authService } from "@/infrastructure/api/authService";
import { ROUTES } from "@/infrastructure/config/routes";

export const useResendEmail = () => {
  const router = useRouter();

  return useMutation<string, Error, string>({
    mutationFn: async (email) => {
      await authService.resendVerification(email);
      return email;
    },
    onSuccess: (email) => {
      router.push(ROUTES.signUpConfirm(email));
    },
    onError: (error) => {
      clientLogger.error("Failed to resend verification", { error });
      toast.error(error.message ?? "Не удалось отправить письмо с подтверждением");
    },
  });
};
