import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import { loginThunk } from "../thunks/loginThunk";
import { RootState, AppDispatch } from "@/infrastructure/redux/store";
import { errorTexts, successTexts } from "@/shared/locales/messages";
import { ROUTES } from "@/infrastructure/config/routes";

interface LoginFormProps {
  email: string;
  password: string;
}

export const useLogin = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.auth.loading);

  const from = searchParams.get("from") || ROUTES.dashboard;

  const login = async ({ email, password }: LoginFormProps) => {
    const thunk = loginThunk({ email, password });
    try {
      await dispatch(thunk).unwrap();
      toast.success(successTexts.loginSuccess);
      router.replace(from);
    } catch (error) {
      //TODO: add log to sentry
      console.log(errorTexts.somethingWentWrong, error);
    }
  };

  return { login, loading };
};
