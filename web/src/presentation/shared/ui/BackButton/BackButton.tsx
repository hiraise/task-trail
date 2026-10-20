"use client";

import clsx from "clsx";

import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { Icon } from "../Icon";

import styles from "./BackButton.module.css";

interface BackButtonProps {
  onClick?: () => void;
  showLabel?: boolean;
  className?: string;
}

export function BackButton({ onClick, showLabel = true, className }: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <button className={clsx(styles.button, className)} onClick={handleClick}>
      <Icon as={ICONS.leftArrow} size="16px" />
      {showLabel && <span>{TEXTS.back}</span>}
    </button>
  );
}
