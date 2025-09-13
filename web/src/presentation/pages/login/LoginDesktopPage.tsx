"use client";

import Link from "next/link";

import styles from "./LoginDesktopPage.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { authTexts } from "@/shared/locales/auth";
import { ROUTES } from "@/infrastructure/config/routes";
import { DesktopLogin } from "@/presentation/widgets/auth/Login";

export function LoginDesktopPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Icon as={ICONS.logoDesktop} />
      </div>
      <div className={styles.content}>
        <DesktopLogin />
        <div className={styles.bottomContent}>
          <span className="body-reg-2">{authTexts.noAccount}</span>
          <Link href={ROUTES.signUp}>
            <span className="btn-font-s">{authTexts.signUp}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
