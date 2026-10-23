import clsx from "clsx";
import { useEffect } from "react";

import styles from "./Dialog.module.css";

interface DialogProps {
  children: React.ReactNode;
  /** A wide dialog for a whole entity, like a task over the kanban; the default one is a form */
  wide?: boolean;
  /** A click on the dimmed background or Escape closes the dialog; without it they do nothing */
  onDismiss?: () => void;
}

export function Dialog({ children, wide = false, onDismiss }: DialogProps) {
  useEffect(() => {
    if (!onDismiss) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div className={styles.dialog} role="dialog" aria-modal="true">
      <div
        className={styles.overlay}
        onClick={(event) => {
          if (event.target === event.currentTarget) onDismiss?.();
        }}
      >
        <div className={clsx(styles.content, wide && styles.wide)}>{children}</div>
      </div>
    </div>
  );
}
