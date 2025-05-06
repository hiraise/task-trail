import { useDispatch, useSelector } from "react-redux";

import { loginThunk } from "../thunks/loginThunk";
import { RootState, AppDispatch } from "@/infrastructure/redux/store";

export const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.auth.loading);

  const login = (email: string, password: string) => {
    const thunk = loginThunk({ email, password });
    return dispatch(thunk).unwrap();
  };

  return { login, loading };
};
