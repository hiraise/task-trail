"use client";

import styles from "./ProfileDesktopPage.module.css";

import { useGetCurrentUser } from "@/application/user/hooks/useGetCurrentUser";
import { TEXTS } from "@/shared/locales/texts";
import { ProfileHeroDesktop } from "@/presentation/widgets/profile/ProfileHero";
import { PersonalDataFormDesktop } from "@/presentation/widgets/profile/PersonalDataForm";
import { ChangePasswordFormDesktop } from "@/presentation/widgets/profile/ChangePasswordForm";

export function ProfileDesktopPage() {
  const { data: user } = useGetCurrentUser();

  if (!user) return null;

  return (
    <div className={styles.content}>
      <ProfileHeroDesktop user={user} />
      <div className={styles.infoWrapper}>
        <div className={styles.infoBlock}>
          <h4>{TEXTS.profile.personalInfo}</h4>
          <PersonalDataFormDesktop />
        </div>
        <div className={styles.infoBlock}>
          <h4>{TEXTS.profile.changePassword}</h4>
          <ChangePasswordFormDesktop />
        </div>
      </div>
    </div>
  );
}
