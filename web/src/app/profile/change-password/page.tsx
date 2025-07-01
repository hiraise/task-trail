"use client";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BackButton } from "@/presentation/ui/BackButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { ChangePasswordForm } from "@/presentation/widgets/profile/ChangePasswordForm/ChangePasswordForm";
import { usePasswordChange } from "@/application/auth/hooks/usePasswordChange";

export default function ChangePasswordPage() {
  const { changePassword, isLoading } = usePasswordChange();

  return (
    <MainContainer>
      <DashboardHeader />
      <Spacer size="80px" />
      <BackButton />
      <Spacer size="20px" />
      <ChangePasswordForm onSubmit={changePassword} isLoading={isLoading} />
      <BottomNavBar />
    </MainContainer>
  );
}
