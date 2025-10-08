"use client";

import { useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { errorTexts } from "@/shared/locales/messages";
import { ROUTES } from "@/infrastructure/config/routes";
import { useEmailConfirm } from "@/application/auth/hooks/useEmailConfirm";
import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";

export default function VerifyEmailPage() {
  const token = useSearchParams().get("token");
  const email = useSearchParams().get("email");
  const router = useRouter();
  const { mutateAsync: confirm } = useEmailConfirm();

  if (!token || !email) {
    toast.error(errorTexts.somethingWentWrong);
    router.push(ROUTES.login);
  }

  useLayoutEffect(() => {
    if (token) confirm(token);
  }, [confirm, token]);

  return <LoadingScreen />;
}
