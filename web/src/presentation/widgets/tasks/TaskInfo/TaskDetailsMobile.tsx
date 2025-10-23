import styles from "./TaskDetailsMobile.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import clsx from "clsx";

interface TaskDetailsMobileProps {
  icon: React.FC<React.SVGProps<SVGElement>>;
  label?: string;
  onClick: () => void;
  placeholder?: string;
}

/**
 * Renders a mobile-friendly button displaying task details with an icon and label.
 * If no label is provided, a placeholder is shown instead.
 * The button triggers the provided `onClick` handler when pressed.
 *
 * @param icon - The icon component to display on the left side of the button.
 * @param label - The text label to display; if not provided, `placeholder` is used.
 * @param onClick - Callback function invoked when the button is clicked.
 * @param placeholder - Fallback text shown when `label` is not provided.
 *
 * @returns A styled button element containing the icon, label/placeholder, and a down arrow icon.
 */
export function TaskDetailsMobile({ icon, label, onClick, placeholder }: TaskDetailsMobileProps) {
  const displayText = label ?? placeholder;

  return (
    <button
      className={styles.container}
      onClick={onClick}
      type="button"
      aria-label={`Выбрать: ${displayText}`}
    >
      <div className={styles.content}>
        <Icon as={icon} size="24px" />
        <span className={clsx("body-reg-2", { [styles.noValue]: !label })}>{displayText}</span>
      </div>
      <Icon as={ICONS.downArrow} size="24px" />
    </button>
  );
}
