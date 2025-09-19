import styles from "./ContentTopBarDesktop.module.css";

import { TabPanel } from "../../tasks/TabPanel";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface ContentTopBarDesktopProps {
  onClick: () => void;
}

export function ContentTopBarDesktop({ onClick }: ContentTopBarDesktopProps) {
  return (
    <div className={styles.container}>
      <TabPanel />
      <button onClick={onClick} className={styles.sortButton}>
        <Icon as={ICONS.sort} size="24px" inheritColor />
      </button>
    </div>
  );
}
