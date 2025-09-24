"use client";

import styles from "./ProfileMobilePage.module.css";

import { useLogout } from "@/application/auth/hooks/useLogout";
import { useGetCurrentUser } from "@/application/user/hooks/useGetCurrentUser";
import { ROUTES } from "@/infrastructure/config/routes";
import { TEXTS } from "@/shared/locales/texts";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { MenuButton } from "@/presentation/ui/MenuButton";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { Spinner } from "@/presentation/ui/Spinner";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { ProfileAvatar } from "@/presentation/widgets/profile/ProfileHero/ProfileAvatar";

export function ProfileMobilePage() {
  const { data: user } = useGetCurrentUser();
  const { mutateAsync: logout, isPending: loading } = useLogout();

  if (!user) return null;

  return (
    <MainContainer>
      <DashboardHeader />
      <h4 className={styles.title}>{TEXTS.profile.title}</h4>
      <Spacer size="24px" />
      <div className={styles.userInfoWrapper}>
        <ProfileAvatar user={user} size="mobile" />
      </div>
      <Spacer size="20px" />
      <div className={styles.buttons}>
        <MenuButton href={ROUTES.profileEditPersonalData} text={TEXTS.profile.editPersonalData} />
        <MenuButton href={ROUTES.profileChangePassword} text={TEXTS.profile.changePassword} />
      </div>
      <div className={styles.logout}>
        <SubmitButton $variant="secondary" onClick={() => logout()}>
          {loading ? <Spinner size={16} /> : TEXTS.profile.logoutFromAccount}
        </SubmitButton>
      </div>
      <BottomNavBar />
    </MainContainer>
  );
}
