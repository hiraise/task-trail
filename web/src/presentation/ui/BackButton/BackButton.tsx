import styles from "./BackButton.module.css";
import { Icon } from "../Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface BackButtonProps {
  onClick?: () => void;
  showLabel?: boolean;
}

//TODO: Add localization support for the button text
export function BackButton({ onClick, showLabel = true }: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  return (
    <button className={styles.button} onClick={handleClick}>
      <Icon as={ICONS.leftArrow} />
      {showLabel && <span>Назад</span>}
    </button>
  );
}
