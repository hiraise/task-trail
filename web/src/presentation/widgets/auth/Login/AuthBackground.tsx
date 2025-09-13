import styles from "./DesktopLogin.module.css";

export function AuthBackground({ children }: { children: React.ReactNode }) {
  return <div className={styles.cardBackground}>{children}</div>;
}
