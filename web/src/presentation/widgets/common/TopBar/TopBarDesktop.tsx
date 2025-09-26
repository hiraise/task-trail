"use client";

import styles from "./TopBarDesktop.module.css";

import { SubmitButton } from "../../auth/_components";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface TopBarProps {
  title: string;
  buttonText: string;
  onClick: () => void;
}

export function TopBarDesktop({ title, buttonText, onClick }: TopBarProps) {
  return (
    <div className={styles.topBar}>
      <h1 className="medium">{title}</h1>
      <SubmitButton className={styles.button} onClick={onClick}>
        <Icon as={ICONS.plus} size="24px" inheritColor />
        <span className="btn-font-s">{buttonText}</span>
      </SubmitButton>
    </div>
  );
}
