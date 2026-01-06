"use client";

import { ICONS } from "@/shared/config/icons";

import { Icon } from "../../../ui/Icon";
import { SubmitButton } from "../../SubmitButton";

import styles from "./TopBarDesktop.module.css";

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
