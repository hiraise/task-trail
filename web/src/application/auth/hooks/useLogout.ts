import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { logoutThunk } from "../thunks/authThunks";
import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { ROUTES } from "@/infrastructure/config/routes";
import { successTexts } from "@/shared/locales/messages";

export const useLogout = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await dispatch(logoutThunk()).unwrap();
      toast.success(successTexts.logoutSuccess);
      router.replace(ROUTES.login);
    } catch (error) {
      clientLogger.error("Logout error:", { logout: error });
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
};
