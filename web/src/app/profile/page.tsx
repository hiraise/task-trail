"use client";

import { useState } from "react";

import "./profile.css";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { ROUTES } from "@/infrastructure/config/routes";
import { MenuButton } from "@/presentation/ui/MenuButton";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { getDisplayName } from "@/shared/utils/getDisplayName";
import { profileTexts } from "@/shared/locales/profile";
import { useLogout } from "@/application/auth/hooks/useLogout";
import { UserAvatar } from "@/presentation/widgets/profile/UserAvatar/UserAvatar";
import { ImageCropper } from "../../presentation/widgets/profile/ImageCropper/ImageCropper";
import { Spinner } from "@/presentation/ui/Spinner";
import { useGetCurrentUser } from "@/application/user/hooks/useGetCurrentUser";
import { useUploadAvatar } from "@/application/user/hooks/useUploadAvatar";

export default function ProfilePage() {
  const { data: user } = useGetCurrentUser();
  const { mutateAsync: updateAvatar } = useUploadAvatar();
  const { mutateAsync: logout, isPending: loading } = useLogout();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageSelected = (file: File) => setSelectedFile(file);

  const handleCropComplete = async (formData: FormData) => {
    setSelectedFile(null);
    await updateAvatar(formData);
  };

  return (
    <MainContainer>
      <DashboardHeader />
      <h1 className="title">{profileTexts.title}</h1>
      <Spacer size="24px" />
      <div className="user-info-container">
        <UserAvatar avatarUrl={user?.avatarUrl} onImageSelected={handleImageSelected} />
        {selectedFile && (
          <ImageCropper
            file={selectedFile}
            onCropComplete={handleCropComplete}
            onClose={() => setSelectedFile(null)}
          />
        )}
        <div className="text-info-container">
          <p className="user-name">{getDisplayName(user)}</p>
          <p className="user-email">{user?.email}</p>
        </div>
      </div>
      <Spacer size="20px" />
      <div className="buttons-container">
        <MenuButton href={ROUTES.profileEditPersonalData} text={profileTexts.editPersonalData} />
        <MenuButton href={ROUTES.profileChangePassword} text={profileTexts.changePassword} />
      </div>
      <div className="btn-container">
        <SubmitButton $variant="secondary" className="logout-btn" onClick={() => logout()}>
          {loading ? <Spinner size={16} /> : profileTexts.logoutFromAccount}
        </SubmitButton>
      </div>
      <BottomNavBar />
    </MainContainer>
  );
}
