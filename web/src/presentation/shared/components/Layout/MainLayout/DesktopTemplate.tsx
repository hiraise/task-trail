import { Drawer } from "../Drawer";

import styles from "./DesktopTemplate.module.css";

export function DesktopTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <Drawer />
      <div className={styles.contentWrapper}>{children}</div>
    </div>
  );
}
