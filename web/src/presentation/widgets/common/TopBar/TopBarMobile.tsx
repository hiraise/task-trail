"use client";

import styles from "./TopBarMobile.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface TopBarMobileProps {
  title: string;
  onClick: () => void;
  onSort?: () => void;
}

export function TopBarMobile({ title, onClick, onSort }: TopBarMobileProps) {
  return (
    <div className={styles.topBar}>
      <div className={styles.title}>
        <h2>{title}</h2>
      </div>
      {onSort && (
        <button className={styles.button} onClick={onSort}>
          <Icon as={ICONS.sort} size="24px" inheritColor />
        </button>
      )}
      <button className={styles.button} onClick={onClick}>
        <Icon as={ICONS.plus} size="24px" inheritColor />
      </button>
    </div>
  );
}
