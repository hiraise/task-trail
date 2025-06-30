import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { errorTexts, successTexts } from "@/shared/locales/messages";
import { ROUTES } from "@/infrastructure/config/routes";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { loginThunk } from "../thunks/authThunks";

interface LoginFormProps {
  email: string;
  password: string;
}

export const useLogin = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const from = searchParams.get("from") || ROUTES.dashboard;
  const dispatch = useAppDispatch();

  const login = async ({ email, password }: LoginFormProps) => {
    setLoading(true);
    try {
      const thunk = loginThunk({ email, password });
      await dispatch(thunk).unwrap();
      toast.success(successTexts.loginSuccess);
      router.replace(from);
    } catch (error) {
      clientLogger.error("Login error:", { login: error });
      toast.error(errorTexts.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
};
