import clsx from "clsx";

import { MenuButton } from "@/presentation/shared";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { ICONS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { adminTexts } from "@/shared/locales/admin";

import { MailForm, ServiceUrlForm, StatusTag, UsersList } from "../../components";
import { useAdminUsers, useServiceSettings } from "../../hooks";

import styles from "./AdminPage.module.css";

/**
 * Раздел администратора сервиса. На телефоне — пункты на отдельные страницы адреса, почты
 * и пользователей, как в профиле; с 768 px — карточки с формами прямо на странице.
 * Раскладку переключает CSS.
 */
export function AdminPage() {
  const { data: settings } = useServiceSettings();
  const { data: users } = useAdminUsers();

  return (
    <section className={styles.page}>
      <div className={styles.phone}>
        <PagesMobileTemplate topBarBackTitle={adminTexts.title} backTo={ROUTES.profile}>
          <div className={styles.menu}>
            <p className={clsx("body-reg-2", styles.secondary)}>{adminTexts.description}</p>
            <nav className={styles.menuItems}>
              <MenuButton
                href={ROUTES.adminServiceUrl}
                text={adminTexts.serviceUrl.title}
                icon={ICONS.edit}
              />
              <MenuButton href={ROUTES.adminMail} text={adminTexts.mail.title} icon={ICONS.mail} />
              <MenuButton
                href={ROUTES.adminUsers}
                text={adminTexts.users.title}
                icon={ICONS.profile}
              />
            </nav>
          </div>
        </PagesMobileTemplate>
      </div>

      <div className={styles.cards}>
        <header className={styles.card}>
          <h2>{adminTexts.title}</h2>
          <p className={clsx("body-reg-2", styles.tertiary)}>{adminTexts.description}</p>
        </header>

        {settings && (
          <>
            <section className={styles.card} aria-labelledby="admin-service-url">
              <div className={styles.heading}>
                <h4 id="admin-service-url">{adminTexts.serviceUrl.title}</h4>
                <p className={clsx("body-reg-2", styles.secondary)}>
                  {adminTexts.serviceUrl.description}
                </p>
              </div>
              <ServiceUrlForm layout="inline" />
            </section>

            <section className={styles.card} aria-labelledby="admin-mail">
              <MailHeading connected={!!settings.mail} />
              <MailForm layout="inline" />
            </section>
          </>
        )}

        {users && (
          <section className={styles.card} aria-labelledby="admin-users">
            <div className={styles.heading}>
              <div className={styles.titleRow}>
                <h4 id="admin-users">{adminTexts.users.title}</h4>
                <span className={clsx("body-reg-2", styles.secondary)}>{users.length}</span>
              </div>
              <p className={clsx("body-reg-2", styles.secondary)}>
                {adminTexts.users.description}
              </p>
            </div>
            <UsersList />
          </section>
        )}
      </div>
    </section>
  );
}

interface MailHeadingProps {
  connected: boolean;
  /** На отдельной странице название уже в верхней панели — только состояние */
  withTitle?: boolean;
}

/** Заголовок почты с состоянием и пояснением: что почта делает или что без неё. */
export function MailHeading({ connected, withTitle = true }: MailHeadingProps) {
  const texts = adminTexts.mail;

  return (
    <div className={styles.heading}>
      <div className={styles.titleRow}>
        {withTitle && <h4 id="admin-mail">{texts.title}</h4>}
        <StatusTag tone={connected ? "on" : "off"}>
          {connected ? texts.connected : texts.notConnected}
        </StatusTag>
      </div>
      <p className={clsx("body-reg-2", styles.secondary)}>
        {connected ? texts.descriptionOn : texts.descriptionOff}
      </p>
    </div>
  );
}
