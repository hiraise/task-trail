"use client";

import Link from "next/link";

import { ICONS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";

import { Icon } from "../../../ui/Icon";

import styles from "./AuthMobileTemplate.module.css";

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
