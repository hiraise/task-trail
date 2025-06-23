"use client";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BackButton } from "@/presentation/ui/BackButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { PersonalDataForm } from "@/presentation/widgets/profile/PersonalDataForm/PersonalDataForm";

const personalDataTexts = {
  userName: "Салунин Максим",
  userEmail: "skvp138@gmail.com",
};

export default function EditPersonalDataPage() {
  return (
    <MainContainer>
      <DashboardHeader />
      <Spacer size="80px" />
      <BackButton />
      <Spacer size="20px" />
      <PersonalDataForm
        initialUsername={personalDataTexts.userName}
        initialEmail={personalDataTexts.userEmail}
        onSubmit={() => console.log("Form submitted")}
      />
      <BottomNavBar />
    </MainContainer>
  );
}
