import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import styles from "./SubmitButton.module.css";

export type ButtonVariant = "primary" | "secondary" | "text";

export interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ variant = "primary", children, className, ...props }, ref) => {
    const buttonClasses = clsx(styles.button, styles[variant], className);

    return (
      <button ref={ref} className={buttonClasses} {...props}>
        {children}
      </button>
    );
  },
);

SubmitButton.displayName = "SubmitButton";
