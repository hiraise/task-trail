import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { loginThunk } from "../thunks/loginThunk";
import { errorTexts, successTexts } from "@/shared/locales/messages";
import { ROUTES } from "@/infrastructure/config/routes";
import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { getCurrentUserThunk } from "@/application/user/thunks/getCurrentUserThunk";

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
      const user = await dispatch(getCurrentUserThunk()).unwrap();
      console.log("User after login:", user);

      console.log();
      toast.success(successTexts.loginSuccess);
      router.replace(from);
    } catch (error) {
      //TODO: add log to sentry
      console.log(errorTexts.somethingWentWrong, error);
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
};
