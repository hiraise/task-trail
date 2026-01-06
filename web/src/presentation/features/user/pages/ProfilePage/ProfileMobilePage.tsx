"use client";

import { useLogout } from "@/presentation/features/auth/hooks";
import { MenuButton, ProfileHeroMobile } from "@/presentation/features/user/components";
import { useGetCurrentUser } from "@/presentation/features/user/hooks";
import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./ProfileMobilePage.module.css";

export function ProfileMobilePage() {
  const { data: user } = useGetCurrentUser();
  const { mutateAsync: logout, isPending: loading } = useLogout();

  if (!user) return null;

  return (
    <section id="profile" className={styles.profile}>
      <ProfileHeroMobile user={user} />
      <div className={styles.buttons}>
        <MenuButton
          href={ROUTES.profileEditPersonalData}
          text={TEXTS.profile.editPersonalData}
          icon={ICONS.edit}
        />
        <MenuButton
          href={ROUTES.profileChangePassword}
          text={TEXTS.profile.changePassword2}
          icon={ICONS.lock}
        />
      </div>

      <button className={styles.logout} onClick={() => logout()} disabled={loading}>
        <Icon as={ICONS.leave} size="32px" inheritColor />
        <span className="btn-font-s" style={{ color: "inherit" }}>
          {TEXTS.profile.logoutFromAccount}
        </span>
      </button>
    </section>
  );
}
