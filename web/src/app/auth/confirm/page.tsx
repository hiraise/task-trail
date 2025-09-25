"use client";

import { useSearchParams } from "next/navigation";
import ConfirmByTokenPage from "./ConfirmByTokenPage";
import EmailAfterRegisterPage from "./EmailAfterRegisterPage";

export default function VerifyEmailPage() {
  const token = useSearchParams().get("token");

  if (token) {
    return <ConfirmByTokenPage token={token} />;
  }
  return <EmailAfterRegisterPage />;
}
