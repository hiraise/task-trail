"use client";

import styles from "./AuthDesktopTemplate.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "../ui/Icon";

export function AuthDesktopTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Icon as={ICONS.logoDesktop} />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
