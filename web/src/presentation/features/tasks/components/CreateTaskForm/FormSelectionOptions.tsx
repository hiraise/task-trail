import clsx from "clsx";
import type { ComponentType, SVGProps } from "react";

import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./FormSelectionOptions.module.css";

interface SelectionFieldProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  placeholder: string;
  /** Выбранное значение; не выбрано — подсказка */
  value?: string;
  invalid?: boolean;
  onClick: () => void;
}

/** Поле формы, значение которого выбирают в отдельном окне: ответственный, проект. */
export function SelectionField({ icon, placeholder, value, invalid, onClick }: SelectionFieldProps) {
  return (
    <button
      type="button"
      className={clsx(styles.container, invalid && styles.invalid)}
      onClick={onClick}
      aria-invalid={invalid}
    >
      <span className={styles.content}>
        <Icon as={icon} size="18px" />
        <span className={clsx(styles.text, !value && styles.placeholder)}>{value || placeholder}</span>
      </span>
      <Icon as={ICONS.downArrow} size="15px" />
    </button>
  );
}
