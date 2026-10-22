import { Icon } from "@/presentation/shared";
import { useLogout } from "@/presentation/shared/hooks";
import { ICONS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { TEXTS } from "@/shared/locales/texts";

import { ChangePasswordForm, MenuButton, PersonalDataForm, ProfileHero } from "../../components";
import { useGetCurrentUser } from "../../hooks";

import styles from "./ProfilePage.module.css";

/**
 * Профиль. На телефоне — шапка, кнопки на отдельные страницы данных и пароля и выход внизу;
 * с 768 px — карточка с формами прямо на странице. Раскладку переключает CSS.
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

      <button type="button" className={styles.logout} onClick={() => logout()} disabled={loading}>
        <Icon as={ICONS.leave} size="32px" inheritColor />
        <span className="btn-font-s">{TEXTS.profile.logoutFromAccount}</span>
      </button>
    </section>
  );
}
