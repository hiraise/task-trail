import styles from "./PagesMobileTemplate.module.css";

interface PagesMobileTemplateProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
}

export function PagesMobileTemplate({ children, topBar }: PagesMobileTemplateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.topBar}>{topBar}</div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
