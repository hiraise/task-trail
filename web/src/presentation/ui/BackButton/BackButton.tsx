import styles from "./BackButton.module.css";
import { Icon } from "../Icon";
import { ICONS } from "@/infrastructure/config/icons";

//TODO: Add localization support for the button text
export function BackButton() {
  return (
    <button className={styles.button} onClick={() => window.history.back()}>
      <Icon as={ICONS.leftArrow} />
      <span>Назад</span>
    </button>
  );
}
