"use client";

import { useEffect } from "react";

import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { getCurrentUserThunk } from "@/application/user/thunks/getCurrentUserThunk";
import { clearState } from "@/application/user/slices/userSlice";

export default function UserInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getCurrentUserThunk())
      .unwrap()
      .catch(() => {
        dispatch(clearState());
      });
  }, [dispatch]);

  return null;
}
