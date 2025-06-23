"use client";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BackButton } from "@/presentation/ui/BackButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { ChangePasswordForm } from "@/presentation/widgets/profile/ChangePasswordForm.tsx/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <MainContainer>
      <DashboardHeader />
      <Spacer size="80px" />
      <BackButton />
      <Spacer size="20px" />
      <ChangePasswordForm onSubmit={() => console.log("Form submitted")} />
      <BottomNavBar />
    </MainContainer>
  );
}
