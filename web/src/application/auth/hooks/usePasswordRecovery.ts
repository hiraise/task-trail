import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { clientLogger } from "@/infrastructure/config/clientLogger";
import { authService } from "@/infrastructure/api/authService";

export const usePasswordRecovery = () => {
  return useMutation<void, Error, string>({
    mutationFn: authService.forgotPassword,
    onSuccess: () => toast.success("Email sent successfully!"),
    onError: (error) => {
      clientLogger.error("Password recovery error", { error });
      toast.error("Failed to send email. Please try again.");
    },
  });
};
