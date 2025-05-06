import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, RootState } from "@/infrastructure/redux/store";
import { signUpThunk } from "../thunks/signUpThunk";

export const useSignUp = () => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.auth.loading);

  const signUp = (email: string, password: string) => {
    const thunk = signUpThunk({ email, password });
    return dispatch(thunk).unwrap();
  };

  return { signUp, loading };
};
