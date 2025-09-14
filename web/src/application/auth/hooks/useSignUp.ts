import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { errorTexts, successTexts } from "@/shared/locales/messages";
import { ROUTES } from "@/infrastructure/config/routes";
import { authService } from "@/infrastructure/api/authService";
import { AuthPayload } from "@/domain/auth/auth.payload";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export const useSignUp = () => {
  const router = useRouter();

  return useMutation<void, Error, AuthPayload>({
    mutationFn: authService.signUp,
    onSuccess: (_, payload) => {
      toast.success(successTexts.signUpSuccessCheckEmail);
      router.push(ROUTES.confirm + `?email=${encodeURIComponent(payload.email)}`);
    },
    onError: (error) => {
      clientLogger.error("Failed to signup", { error });
      toast.error(errorTexts.somethingWentWrong);
    },
  });
};
