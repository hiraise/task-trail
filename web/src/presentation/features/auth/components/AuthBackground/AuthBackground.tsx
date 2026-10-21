import styles from "./AuthBackground.module.css";

export function AuthBackground({ children }: { children: React.ReactNode }) {
  return <div className={styles.background}>{children}</div>;
}
