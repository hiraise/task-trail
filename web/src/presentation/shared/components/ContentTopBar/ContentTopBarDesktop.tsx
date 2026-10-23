import { ICONS } from "@/shared/config/icons";

import { Icon } from "../../ui";
import { TabPanel } from "../TabPanel";

import styles from "./ContentTopBarDesktop.module.css";

interface ContentTopBarDesktopProps {
  onClick: () => void;
  /**
   * The Active / Archived tabs (ADR-0027): they need a TabPanelProvider above. Lists without
   * an archive — boards and board tasks — pass false and get only the sort button on the right.
   */
  tabs?: boolean;
}

export function ContentTopBarDesktop({ onClick, tabs = true }: ContentTopBarDesktopProps) {
  return (
    <div className={styles.container}>
      {tabs && <TabPanel />}
      <button onClick={onClick} className={styles.sortButton}>
        <Icon as={ICONS.sort} size="24px" inheritColor />
      </button>
    </div>
  );
}
