import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import { signUpThunk } from "../thunks/signUpThunk";
import { errorTexts, successTexts } from "@/shared/locales/messages";
import { AppDispatch, RootState } from "@/infrastructure/redux/store";
import { ROUTES } from "@/infrastructure/config/routes";

interface SignUpFormProps {
  email: string;
  password: string;
}

export const useSignUp = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.auth.loading);

  const signUp = async ({ email, password }: SignUpFormProps) => {
    const thunk = signUpThunk({ email, password });
    try {
      await dispatch(thunk).unwrap();
      toast.success(successTexts.signUpSuccessCheckEmail);
      router.push(ROUTES.confirm + `?email=${encodeURIComponent(email)}`);
    } catch (error) {
      //TODO: add log to sentry
      console.log(errorTexts.somethingWentWrong, error);
    }
  };

  return { signUp, loading };
};
