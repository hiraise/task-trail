import styles from "./BottomContent.module.css";

export function BottomContent({ children }: { children: React.ReactNode }) {
  return <div className={styles.bottomContent}>{children}</div>;
}
