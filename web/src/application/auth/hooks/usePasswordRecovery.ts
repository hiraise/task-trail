import { useState } from "react";
import { toast } from "sonner";

import { useAppDispatch } from "@/infrastructure/redux/hooks";
import { forgotPasswordThunk } from "../thunks/authThunks";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export const usePasswordRecovery = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const recover = async (email: string) => {
    setLoading(true);
    try {
      await dispatch(forgotPasswordThunk(email)).unwrap();
      toast.success("Email sent successfully!");
    } catch (error) {
      clientLogger.error("Password recovery error", { error });
      toast.error("Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { recover, loading };
};
