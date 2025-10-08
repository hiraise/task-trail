import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authService } from "@/infrastructure/api/authService";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { ROUTES } from "@/infrastructure/config/routes";

export const useEmailConfirm = () => {
  const router = useRouter();

  return useMutation<void, Error, string>({
    mutationFn: async (token) => {
      await authService.confirmEmail(token);
      router.push(ROUTES.login);
      toast.success("Email успешно подтвержден. Теперь вы можете войти в систему");
    },
    onError: (error) => {
      clientLogger.error("Failed to confirm email", { error });
      toast.error("Что-то пошло не так. Пожалуйста попробуйте еще раз.");
    },
  });
};
