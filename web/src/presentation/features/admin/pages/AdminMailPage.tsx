import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { adminTexts } from "@/shared/locales/admin";

import { MailForm } from "../components";
import { useServiceSettings } from "../hooks";

import { MailHeading } from "./AdminPage";
import styles from "./AdminSubpage.module.css";

/** Почта отдельной страницей — с телефона; шире та же форма стоит в разделе. */
export function AdminMailPage() {
  const { data: settings } = useServiceSettings();

  return (
    <PagesMobileTemplate topBarBackTitle={adminTexts.mail.title}>
      {settings ? (
        <div className={styles.content}>
          <MailHeading connected={!!settings.mail} withTitle={false} />
          <MailForm layout="page" />
        </div>
      ) : null}
    </PagesMobileTemplate>
  );
}
