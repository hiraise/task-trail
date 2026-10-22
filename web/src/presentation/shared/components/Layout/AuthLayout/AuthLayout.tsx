import { Link } from "@tanstack/react-router";

import { ICONS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { Icon } from "@/presentation/shared/ui";

import styles from "./AuthLayout.module.css";

/** Раскладка экранов доступа: шапка с логотипом и область экрана под ней. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to={ROUTES.login} className={styles.logoLink} aria-label="TaskTrail">
          <Icon as={ICONS.logoDesktop} className={styles.logo} />
        </Link>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
