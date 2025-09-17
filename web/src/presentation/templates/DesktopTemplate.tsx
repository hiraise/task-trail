import styles from "./DesktopTemplate.module.css";

import { Drawer } from "../widgets/common/Drawer";

export function DesktopTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <Drawer />
      <div className={styles.contentWrapper}>{children}</div>
    </div>
  );
}
