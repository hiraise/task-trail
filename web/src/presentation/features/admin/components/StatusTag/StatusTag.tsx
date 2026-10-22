import clsx from "clsx";

import styles from "./StatusTag.module.css";

interface StatusTagProps {
  children: React.ReactNode;
  /** Tag color: admin for "Administrator", on for mail connected, off for not connected */
  tone: "admin" | "on" | "off";
}

/** A small tag next to a name or a heading: user role, mail state. */
export function StatusTag({ children, tone }: StatusTagProps) {
  return <span className={clsx("caption-med", styles.tag, styles[tone])}>{children}</span>;
}
