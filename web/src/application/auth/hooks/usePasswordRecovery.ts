import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { clientLogger } from "@/infrastructure/config/clientLogger";
import { authService } from "@/infrastructure/api/authService";
import { ROUTES } from "@/infrastructure/config/routes";

export const usePasswordRecovery = () => {
  const router = useRouter();

  return useMutation<string, Error, string>({
    mutationFn: async (email) => {
      await authService.forgotPassword(email);
      return email;
    },
    onSuccess: (email) => {
      router.push(ROUTES.passwordRecoveryConfirm(email));
    },
    onError: (error) => {
      clientLogger.error("Password recovery error", { error });
      toast.error("Failed to send email. Please try again.");
    },
  });
};
