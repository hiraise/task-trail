import clsx from "clsx";
import type { ComponentType, SVGProps } from "react";

import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./TaskField.module.css";

interface TaskFieldProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  /** Значения нет — вместо него `placeholder` */
  value?: string;
  placeholder: string;
  onClick: () => void;
}

/**
 * Поле задачи, которое меняют выбором: ответственный, проект. На телефоне — плашка со стрелкой,
 * с 768 px — подпись слева и значение, при наведении — значок правки.
 */
export function TaskField({ icon, label, value, placeholder, onClick }: TaskFieldProps) {
  const text = value ?? placeholder;

  return (
    <div className={styles.field}>
      <span className={clsx("body-reg-2", styles.label)}>{label}</span>
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        aria-label={`${label}: ${text}`}
      >
        <span className={styles.value}>
          <Icon as={icon} size="24px" />
          <span className={clsx("body-reg-2", styles.text, !value && styles.empty)}>{text}</span>
        </span>
        <span className={styles.chevron}>
          <Icon as={ICONS.downArrow} size="24px" />
        </span>
        <span className={styles.edit}>
          <Icon as={ICONS.edit} size="24px" />
        </span>
      </button>
    </div>
  );
}
