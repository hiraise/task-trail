"use client";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BackButton } from "@/presentation/ui/BackButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { PersonalDataForm } from "@/presentation/widgets/profile/PersonalDataForm/PersonalDataForm";
import { useUpdateUser } from "@/application/user/hooks/useUpdateUser";
import { getDisplayName } from "@/shared/utils/getDisplayName";

const personalDataTexts = {
  userName: "Салунин Максим",
  userEmail: "skvp138@gmail.com",
};

export default function EditPersonalDataPage() {
  const { user, update } = useUpdateUser();

  const handleSumbit = async (data: { username: string }) => {
    await update.mutateAsync(data);
  };

  return (
    <MainContainer>
      <DashboardHeader />
      <Spacer size="80px" />
      <BackButton />
      <Spacer size="20px" />
      <PersonalDataForm
        initialUsername={getDisplayName(user)}
        initialEmail={user?.email || personalDataTexts.userEmail}
        onSubmit={handleSumbit}
      />
      <BottomNavBar />
    </MainContainer>
  );
}
