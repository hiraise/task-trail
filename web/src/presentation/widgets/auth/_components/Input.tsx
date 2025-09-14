"use client";

import clsx from "clsx";

import styles from "./Input.module.css";

import { Icon } from "@/presentation/ui/Icon";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  hasError?: boolean;
}

export function Input({ icon, label, hasError, ...rest }: InputProps) {
  const iconColor = hasError ? "var(--icon-critical)" : "var(--icon-primary)";
  return (
    <div className={styles.inputWrapper}>
      <input
        className={clsx(styles.input, "body-reg-2", { [styles.error]: hasError })}
        id={rest.id}
        {...rest}
      />
      <label htmlFor={rest.id} className={clsx(styles.label, "caption-2-reg")}>
        {label}
      </label>
      <div className={styles.iconWrapper}>
        <Icon as={icon} size="24px" color={iconColor} />
      </div>
    </div>
  );
}
