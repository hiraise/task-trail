import styles from "./Dialog.module.css";

export function Dialog({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.dialog} role="dialog" aria-modal="true">
      <div className={styles.overlay}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
