"use client";

import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
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

  return (
    <MainContainer>
      <DashboardHeader />
      <Spacer size="80px" />
      <PasswordResetForm onSubmit={handleSubmit} isLoading={isLoading} />
    </MainContainer>
  );
}
