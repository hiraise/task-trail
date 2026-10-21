import clsx from "clsx";

import styles from "./FormFieldError.module.css";

export function FormFieldError({ children }: { children: React.ReactNode }) {
  return (
    <span className={clsx("caption-2-med", styles.error)} role="alert" aria-live="polite">
      {children}
    </span>
  );
}
