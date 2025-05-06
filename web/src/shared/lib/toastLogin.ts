import { toast } from "sonner";
import { LoginResponse } from "@/application/auth/types/types";

export const toastLogin = async (loginFn: () => Promise<LoginResponse>) => {
  try {
    const result = await loginFn();
    toast.success(`Добро пожаловать, ${result.user.name}!`);
    return result;
  } catch (error: unknown) {
    toast.error(typeof error === "string" ? error : "Ошибка входа");
    throw error;
  }
};
