import { useNavigate, useSearch } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { toast } from "sonner";

import { errorTexts } from "@/shared/locales/messages";
import { ROUTES } from "@/shared/config/routes";
import { LoadingScreen } from "@/presentation/shared";

import { useVerifyEmail } from "../../hooks";

export function VerifyEmailPage() {
  const { token, email } = useSearch({ from: "/auth/confirm" });
  const navigate = useNavigate();
  const { mutateAsync: confirm } = useVerifyEmail();

  if (!token || !email) {
    toast.error(errorTexts.somethingWentWrong);
    navigate({ to: ROUTES.login });
  }

  useLayoutEffect(() => {
    if (token) confirm({ token });
  }, [confirm, token]);

  return <LoadingScreen />;
}
