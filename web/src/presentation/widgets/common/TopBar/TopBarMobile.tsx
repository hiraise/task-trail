"use client";

import styles from "./TopBarMobile.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface TopBarMobileProps {
  title: string;
  onClick: () => void;
}

export function TopBarMobile({ title, onClick }: TopBarMobileProps) {
  return (
    <div className={styles.topBar}>
      <div className={styles.title}>
        <h2>{title}</h2>
      </div>
      <button className={styles.button} onClick={onClick}>
        <Icon as={ICONS.plus} size="24px" inheritColor />
      </button>
    </div>
  );
}
