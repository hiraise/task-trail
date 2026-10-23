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
  /** `critical` draws the value in --text-critical, like an overdue due date (ADR-0034) */
  tone?: "critical";
  /** A value drawn by the caller in place of the text, like label chips; pass its text as `ariaValue` */
  children?: ReactNode;
  /** The value for screen readers when `children` draw it */
  ariaValue?: string;
  /** No handler — the field is read-only, like in an archived task (ADR-0027) */
  onClick?: () => void;
}

function FieldText({ text, empty, tone }: { text: string; empty: boolean; tone?: "critical" }) {
  return (
    <span className={clsx("body-reg-2", styles.text, empty && styles.empty, !empty && tone && styles[tone])}>
      {text}
    </span>
  );
}

/**
 * A task field changed by picking a value: assignee, project, priority, due date, labels. On a phone — a panel with an arrow;
 * from 768 px — a label on the left and the value, with an edit icon on hover.
 */
export function TaskField({
  icon,
  iconNode,
  label,
  value,
  placeholder,
  tone,
  children,
  ariaValue,
  onClick,
}: TaskFieldProps) {
  const text = children ? (ariaValue ?? "") : (value ?? placeholder);
  const content = (
    <span className={styles.value}>
      {iconNode ?? (icon && <Icon as={icon} size="24px" />)}
      {children ? <span className={styles.children}>{children}</span> : <FieldText text={text} empty={!value} tone={tone} />}
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
