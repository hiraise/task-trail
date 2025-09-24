"use client";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BackButton } from "@/presentation/ui/BackButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { usePasswordChange } from "@/application/auth/hooks/usePasswordChange";
import { ChangePasswordFormMobile } from "@/presentation/widgets/profile/ChangePasswordForm";

export default function ChangePasswordPage() {
  const { mutateAsync: changePassword, isPending: isLoading } = usePasswordChange();

  return (
    <MainContainer>
      <DashboardHeader />
      <Spacer size="80px" />
      <BackButton />
      <Spacer size="20px" />
      <ChangePasswordFormMobile onSubmit={changePassword} isLoading={isLoading} />
      <BottomNavBar />
    </MainContainer>
  );
}
