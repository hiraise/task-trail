import clsx from "clsx";

import styles from "./StatusTag.module.css";

interface StatusTagProps {
  children: React.ReactNode;
  /** Цвет метки: admin — «Администратор», on — почта подключена, off — не подключена */
  tone: "admin" | "on" | "off";
}

/** Небольшая метка рядом с именем или заголовком: роль пользователя, состояние почты. */
export function StatusTag({ children, tone }: StatusTagProps) {
  return <span className={clsx("caption-med", styles.tag, styles[tone])}>{children}</span>;
}
