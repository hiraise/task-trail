import clsx from "clsx";
import type { ComponentType, ReactNode, SVGProps } from "react";

import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./TaskField.module.css";

interface TaskFieldProps {
  /** The field icon; pass `icon` or `iconNode` */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** A ready icon in place of `icon`, like the priority icon of the current value */
  iconNode?: ReactNode;
  label: string;
  /** No value — `placeholder` is shown instead */
  value?: string;
  placeholder: string;
  /** No handler — the field is read-only, like in an archived task (ADR-0027) */
  onClick?: () => void;
}

/**
 * A task field changed by picking a value: assignee, project, priority. On a phone — a panel with an arrow;
 * from 768 px — a label on the left and the value, with an edit icon on hover.
 */
export function TaskField({ icon, iconNode, label, value, placeholder, onClick }: TaskFieldProps) {
  const text = value ?? placeholder;
  const content = (
    <span className={styles.value}>
      {iconNode ?? (icon && <Icon as={icon} size="24px" />)}
      <span className={clsx("body-reg-2", styles.text, !value && styles.empty)}>{text}</span>
    </span>
  );

  if (!onClick) {
    return (
      <div className={styles.field}>
        <span className={clsx("body-reg-2", styles.label)}>{label}</span>
        <div className={clsx(styles.button, styles.readOnly)} aria-label={`${label}: ${text}`}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <span className={clsx("body-reg-2", styles.label)}>{label}</span>
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        aria-label={`${label}: ${text}`}
      >
        {content}
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
