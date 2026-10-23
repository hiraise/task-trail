import clsx from "clsx";
import type { ComponentType, ReactNode, SVGProps } from "react";

import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./FormSelectionOptions.module.css";

interface SelectionFieldProps {
  /** The field icon; pass `icon` or `iconNode` */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** A ready icon in place of `icon`, like the priority icon of the current value */
  iconNode?: ReactNode;
  placeholder: string;
  /** Selected value; nothing selected — the hint */
  value?: string;
  invalid?: boolean;
  onClick: () => void;
}

/** A form field whose value is picked in a separate modal: assignee, project, priority. */
export function SelectionField({
  icon,
  iconNode,
  placeholder, value,
  invalid,
  onClick,
}: SelectionFieldProps) {
  return (
    <button
      type="button"
      className={clsx(styles.container, invalid && styles.invalid)}
      onClick={onClick}
      aria-invalid={invalid}
    >
      <span className={styles.content}>
        {iconNode ?? (icon && <Icon as={icon} size="18px" />)}
        <span className={clsx(styles.text, !value && styles.placeholder)}>{value || placeholder}</span>
      </span>
      <Icon as={ICONS.downArrow} size="15px" />
    </button>
  );
}
