"use client";

import { useState } from "react";
import { toast } from "sonner";

import "./profile.css";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { ROUTES } from "@/infrastructure/config/routes";
import { MenuButton } from "@/presentation/ui/MenuButton";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { useAppDispatch, useAppSelector } from "@/infrastructure/redux/hooks";
import { getDisplayName } from "@/shared/utils/getDisplayName";
import { profileTexts } from "@/shared/locales/profile";
import Spinner from "@/presentation/widgets/common/Spinner";
import { useLogout } from "@/application/auth/hooks/useLogout";
import { UserAvatar } from "@/presentation/widgets/profile/UserAvatar/UserAvatar";
import { ImageCropper } from "../../presentation/widgets/profile/ImageCropper/ImageCropper";
import { userService } from "@/infrastructure/api/userService";
import { updateAvatar } from "@/application/user/slices/userSlice";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.data);
  const { logout, loading } = useLogout();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageSelected = (file: File) => setSelectedFile(file);

  const handleCropComplete = async (formData: FormData) => {
    setSelectedFile(null);
    try {
      const avatarUrl = await userService.uploadAvatar(formData);
      if (avatarUrl) {
        dispatch(updateAvatar(avatarUrl));
        toast.success("Avatar updated successfully!");
      } else {
        toast.error("Server did not return avatar url");
      }
    } catch {
      toast.error("Failed to update avatar");
    }
  };

  return (
    <MainContainer>
      <DashboardHeader />
      <h1 className="title">{profileTexts.title}</h1>
      <Spacer size="24px" />
      <div className="user-info-container">
        <UserAvatar
          avatarUrl={user?.avatarUrl}
          onImageSelected={handleImageSelected}
        />
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
        <MenuButton
          href={ROUTES.profileEditPersonalData}
          text={profileTexts.editPersonalData}
        />
        <MenuButton
          href={ROUTES.profileChangePassword}
          text={profileTexts.changePassword}
        />
      </div>
      <div className="btn-container">
        <SubmitButton
          $variant="secondary"
          className="logout-btn"
          onClick={logout}
        >
          {loading ? <Spinner size={16} /> : profileTexts.logoutFromAccount}
        </SubmitButton>
      </div>
      <BottomNavBar />
    </MainContainer>
  );
}
