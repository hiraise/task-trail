"use client";

import "./profile.css";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { ROUTES } from "@/infrastructure/config/routes";
import { MenuButton } from "@/presentation/ui/MenuButton";
import { SubmitButton } from "@/presentation/ui/SubmitButton";

const profileTexts = {
  title: "Личный кабинет",
  userName: "Салунин Максим",
  userEmail: "skvp138@gmail.com",
  editPersonalData: "Изменить личные данные",
  changePassword: "Изменить пароль",
  logoutFromAccount: "Выйти из аккаунта",
};

export default function ProfilePage() {
  return (
    <MainContainer>
      <DashboardHeader />
      <h1 className="title">{profileTexts.title}</h1>
      <Spacer size="24px" />
      <div className="user-info-container">
        <div className="icon-wrapper">
          <Icon as={ICONS.profileLarge} size="40px" className="main-icon" />
          <Icon
            as={ICONS.camera}
            size="29px"
            className="badge-icon"
            color="var(--background)"
          />
        </div>
        <div className="text-info-container">
          <p className="user-name">{profileTexts.userName}</p>
          <p className="user-email">{profileTexts.userEmail}</p>
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
          onClick={() => alert("Logout clicked")}
        >
          {profileTexts.logoutFromAccount}
        </SubmitButton>
      </div>
      <BottomNavBar />
    </MainContainer>
  );
}
