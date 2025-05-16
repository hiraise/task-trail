import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import { loginThunk } from "../thunks/loginThunk";
import { RootState, AppDispatch } from "@/infrastructure/redux/store";
import { errorTexts, successTexts } from "@/shared/locales/messages";

interface LoginFormProps {
  email: string;
  password: string;
}

export const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.auth.loading);

  const login = async ({ email, password }: LoginFormProps) => {
    const thunk = loginThunk({ email, password });
    try {
      await dispatch(thunk).unwrap();
      toast.success(successTexts.loginSuccess);
    } catch (error) {
      //TODO: add log to sentry
      console.log(errorTexts.somethingWentWrong, error);
    }
  };

  return { login, loading };
};
