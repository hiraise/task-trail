"use client";

import styles from "./ProfileDesktopPage.module.css";

import { useGetCurrentUser } from "@/application/user/hooks/useGetCurrentUser";
import { ROUTES } from "@/infrastructure/config/routes";
import { TEXTS } from "@/shared/locales/texts";
import { MenuButton } from "@/presentation/ui/MenuButton";
import { ProfileHero } from "@/presentation/widgets/profile/ProfileHero";
import { PersonalDataFormDesktop } from "@/presentation/widgets/profile/PersonalDataForm";

export function ProfileDesktopPage() {
  const { data: user } = useGetCurrentUser();

  if (!user) return null;

  return (
    <div className={styles.content}>
      <ProfileHero user={user} />
      <div className={styles.infoWrapper}>
        <div className={styles.infoBlock}>
          <h4>{TEXTS.profile.personalInfo}</h4>
          <PersonalDataFormDesktop />
        </div>
        <div className={styles.infoBlock}>
          <h4>{TEXTS.profile.changePassword}</h4>
          <MenuButton href={ROUTES.profileEditPersonalData} text={TEXTS.profile.editPersonalData} />
          <MenuButton href={ROUTES.profileChangePassword} text={TEXTS.profile.changePassword} />
        </div>
      </div>
    </div>
  );
}
