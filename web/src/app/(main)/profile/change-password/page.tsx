"use client";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BackButton } from "@/presentation/ui/BackButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { ChangePasswordFormMobile } from "@/presentation/widgets/profile/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <MainContainer>
      <DashboardHeader />
      <Spacer size="80px" />
      <BackButton />
      <Spacer size="20px" />
      <ChangePasswordFormMobile />
    </MainContainer>
  );
}
