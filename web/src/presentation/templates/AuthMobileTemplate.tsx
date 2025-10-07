"use client";

import Link from "next/link";

import styles from "./AuthMobileTemplate.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { ROUTES } from "@/infrastructure/config/routes";
import { Icon } from "../ui/Icon";

export function AuthMobileTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href={ROUTES.login}>
          <Icon as={ICONS.logoMobile} />
        </Link>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
