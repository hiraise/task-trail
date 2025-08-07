import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { errorTexts, successTexts } from "@/shared/locales/messages";
import { ROUTES } from "@/infrastructure/config/routes";
import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { signUpThunk } from "../thunks/authThunks";

interface SignUpFormProps {
  email: string;
  password: string;
}

export const useSignUp = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const signUp = async ({ email, password }: SignUpFormProps) => {
    const thunk = signUpThunk({ email, password });
    setLoading(true);
    try {
      await dispatch(thunk).unwrap();
      toast.success(successTexts.signUpSuccessCheckEmail);
      router.push(ROUTES.confirm + `?email=${encodeURIComponent(email)}`);
    } catch (error) {
      //TODO: add log to sentry
      console.log(errorTexts.somethingWentWrong, error);
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading };
};
