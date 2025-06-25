"use client";

import { useEffect } from "react";

import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { getCurrentUserThunk } from "@/application/user/thunks/getCurrentUserThunk";

export default function UserInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getCurrentUserThunk());
  }, [dispatch]);

  return null;
}
