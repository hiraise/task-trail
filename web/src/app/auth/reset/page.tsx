"use client";

import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { usePasswordReset } from "@/application/auth/hooks/usePasswordReset";
import { PasswordResetForm } from "@/presentation/widgets/auth/PasswordResetForm";

export default function PasswordResetPage() {
  const { mutateAsync: resetPassword, isPending: isLoading } = usePasswordReset();

  const token = useSearchParams().get("token");

  const handleSubmit = async (password: string) => {
    if (!token) {
      toast.error("Что-то пошло не так");
      return;
    }
    await resetPassword({ password, token });
  };

  return <PasswordResetForm onSubmit={handleSubmit} isLoading={isLoading} />;
}
