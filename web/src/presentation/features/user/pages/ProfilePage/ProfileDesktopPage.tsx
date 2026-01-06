"use client";

import {
  ChangePasswordFormDesktop,
  PersonalDataFormDesktop,
  ProfileHeroDesktop,
} from "@/presentation/features/user/components";
import { useGetCurrentUser } from "@/presentation/features/user/hooks";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./ProfileDesktopPage.module.css";

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
