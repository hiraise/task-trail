import styles from "./TitleWrapper.module.css";

export function TitleWrapper({ children }: { children: React.ReactNode }) {
  return <div className={styles.title}>{children}</div>;
}
