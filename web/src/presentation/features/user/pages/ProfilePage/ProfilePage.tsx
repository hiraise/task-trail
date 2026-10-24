import { Icon, MenuButton } from "@/presentation/shared";
import { useLogout } from "@/presentation/shared/hooks";
import { ICONS } from "@/shared/config/icons";
import { notificationsTexts } from "@/shared/locales/notifications";
import { ROUTES } from "@/shared/config/routes";
import { TEXTS } from "@/shared/locales/texts";

import {
  ChangePasswordForm,
  EmailNotificationsSwitch,
  PersonalDataForm,
  ProfileHero,
} from "../../components";
import { useGetCurrentUser } from "../../hooks";

import styles from "./ProfilePage.module.css";

/**
 * Profile. On a phone: the header, buttons to separate pages for data and password (for an administrator,
 * also to the administrator section: wider, it is in the side menu) and sign-out at the bottom;
 * from 768 px, a card with forms right on the page. The notification emails switch is on both:
 * above sign-out on a phone, the third block of the card wider. CSS switches the layout.
 */
export function ProfilePage() {
  const { data: user } = useGetCurrentUser();
  const { mutate: logout, isPending: loading } = useLogout();

  if (!user) return null;

  return (
    <section id="profile" className={styles.profile}>
      <ProfileHero user={user} />

      <nav className={styles.menu}>
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
        {user.isAdmin && (
          <MenuButton href={ROUTES.admin} text={TEXTS.drawer.admin} icon={ICONS.settings} />
        )}
      </nav>

      <div className={styles.forms}>
        <div className={styles.block}>
          <h4>{TEXTS.profile.personalInfo}</h4>
          <PersonalDataForm layout="inline" />
        </div>
        <div className={styles.block}>
          <h4>{TEXTS.profile.changePassword}</h4>
          <ChangePasswordForm layout="inline" />
        </div>
      </div>

      {/* Outside .menu and .forms: shown on every width (artboard F) */}
      <div className={styles.notifications}>
        <h4 className={styles.wideOnly}>{notificationsTexts.title}</h4>
        <div className={styles.notificationsBox}>
          <EmailNotificationsSwitch />
        </div>
      </div>

      <button type="button" className={styles.logout} onClick={() => logout()} disabled={loading}>
        <Icon as={ICONS.leave} size="32px" inheritColor />
        <span className="btn-font-s">{TEXTS.profile.logoutFromAccount}</span>
      </button>
    </section>
  );
}
