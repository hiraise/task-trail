"use client";

import clsx from "clsx";

import styles from "./SearchField.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

export function SearchField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={styles.inputWrapper}>
      <input className={clsx(styles.input, "body-reg-2")} {...props} />
      <div className={styles.iconWrapper}>
        <Icon as={ICONS.search} size="24px" inheritColor />
      </div>
    </div>
  );
}
