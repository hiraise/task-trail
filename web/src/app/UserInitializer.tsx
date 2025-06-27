"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { protectedRoutes, ROUTES } from "@/infrastructure/config/routes";
import { getCurrentUserThunk } from "@/application/user/thunks/getCurrentUserThunk";
import { checkAuthStatusThunk } from "@/application/auth/thunks/authThunks";

export default function UserInitializer() {
  const user = useAppSelector((state) => state.user.data);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathName = usePathname();

  useEffect(() => {
    if (!protectedRoutes.some((route) => pathName.startsWith(route))) return;

    (async () => {
      try {
        await dispatch(checkAuthStatusThunk()).unwrap();
        if (!user) await dispatch(getCurrentUserThunk()).unwrap();
      } catch {
        router.replace(ROUTES.login);
      }
    })();
    // eslint-disable-next-line
  }, [dispatch, pathName, router]);

  return null;
}
