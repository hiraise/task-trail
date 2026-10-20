import styles from "./TasksDesktopTemplate.module.css";

interface TasksDesktopTemplateProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
}

export function TasksDesktopTemplate({ children, topBar }: TasksDesktopTemplateProps) {
  return (
    <div className={styles.contentWrapper}>
      {topBar}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
