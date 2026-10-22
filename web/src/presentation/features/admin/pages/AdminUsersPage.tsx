import clsx from "clsx";

import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { adminTexts } from "@/shared/locales/admin";

import { UsersList } from "../components";

import styles from "./AdminSubpage.module.css";

/** Users as a separate page, from a phone; wider, the same list is in the section. */
export function AdminUsersPage() {
  return (
    <PagesMobileTemplate topBarBackTitle={adminTexts.users.title}>
      <div className={styles.content}>
        <p className={clsx("body-reg-2", styles.secondary)}>{adminTexts.users.description}</p>
        <UsersList />
      </div>
    </PagesMobileTemplate>
  );
}
