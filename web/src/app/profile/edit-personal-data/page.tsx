"use client";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BackButton } from "@/presentation/ui/BackButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { PersonalDataForm } from "@/presentation/widgets/profile/PersonalDataForm/PersonalDataForm";
import { useUpdateUser } from "@/application/user/hooks/useUpdateUser";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import { getDisplayName } from "@/shared/utils/getDisplayName";

const personalDataTexts = {
  userName: "Салунин Максим",
  userEmail: "skvp138@gmail.com",
};

export default function EditPersonalDataPage() {
  const { updateUser } = useUpdateUser();
  const user = useAppSelector((state) => state.user.data);

  const handleSumbit = async (data: { username: string }) => {
    await updateUser({ data });
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
