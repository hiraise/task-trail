import { useChangePasswordMutation } from "@/infrastructure/adapters/authApi";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { toast } from "sonner";

export interface ChangePasswordFormProps {
  newPassword: string;
  oldPassword: string;
}

export const usePasswordChange = () => {
  const [changePasswordMutation, { isLoading }] = useChangePasswordMutation();

  const changePassword = async (data: ChangePasswordFormProps) => {
    try {
      await changePasswordMutation(data).unwrap();
      toast.success("Пароль успешно изменен");
    } catch (error) {
      clientLogger.error("usePasswordChange error:", { login: error });
      toast.error(
        "Не удалось изменить пароль. Пожалуйста, попробуйте еще раз."
      );
    }
  };

  return { changePassword, isLoading };
};
