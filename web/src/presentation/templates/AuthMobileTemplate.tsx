"use client";

import styles from "./AuthMobileTemplate.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "../ui/Icon";

export function AuthMobileTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Icon as={ICONS.logoMobile} />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
