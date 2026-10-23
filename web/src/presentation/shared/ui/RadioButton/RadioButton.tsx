import type { ReactNode } from "react";

import styles from "./RadioButton.module.css";

interface RadioButtonOption {
  value: string;
  label: string;
}

/** A radio row: the label on the left, the radio on the right; `icon` goes before the label. */
export function RadioButton<T extends RadioButtonOption>({
  option,
  icon,
  ...rest
}: { option: T; icon?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={styles.option}>
      <span className={`btn-font-m ${styles.label}`}>
        {icon}
        {option.label}
      </span>
      <input type="radio" className={styles.radio} value={option.value} {...rest} />
    </label>
  );
}
