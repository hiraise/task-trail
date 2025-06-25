import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { errorTexts, successTexts } from "@/shared/locales/messages";
import { ROUTES } from "@/infrastructure/config/routes";
import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { getCurrentUserThunk } from "@/application/user/thunks/getCurrentUserThunk";
import { loginThunk } from "../thunks/authThunks";
import { clientLogger } from "@/infrastructure/config/clientLogger";

interface LoginFormProps {
  email: string;
  password: string;
}

export const useLogin = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const from = searchParams.get("from") || ROUTES.dashboard;
  const [loading, setLoading] = useState(false);

  const login = async ({ email, password }: LoginFormProps) => {
    setLoading(true);
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      await dispatch(getCurrentUserThunk()).unwrap();
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
