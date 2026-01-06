"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect } from "react";
import { toast } from "sonner";

import { useVerifyEmail } from "@/presentation/features/auth/hooks";
import { LoadingScreen } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";
import { errorTexts } from "@/shared/locales/messages";

export default function VerifyEmailPage() {
  const token = useSearchParams().get("token");
  const email = useSearchParams().get("email");
  const router = useRouter();
  const { mutateAsync: confirm } = useVerifyEmail();

  if (!token || !email) {
    toast.error(errorTexts.somethingWentWrong);
    router.push(ROUTES.login);
  }

  useLayoutEffect(() => {
    if (token) confirm({ token });
  }, [confirm, token]);

  return <LoadingScreen />;
}
