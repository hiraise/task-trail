"use client";

import { ICONS } from "@/shared/config/icons";

import { Icon } from "../../../ui";

import styles from "./AuthDesktopTemplate.module.css";

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
