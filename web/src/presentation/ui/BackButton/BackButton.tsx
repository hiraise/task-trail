import clsx from "clsx";

import styles from "./BackButton.module.css";
import { Icon } from "../Icon";
import { ICONS } from "@/infrastructure/config/icons";
import { TEXTS } from "@/shared/locales/texts";

interface BackButtonProps {
  onClick?: () => void;
  showLabel?: boolean;
  className?: string;
}

export function BackButton({ onClick, showLabel = true, className }: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
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
