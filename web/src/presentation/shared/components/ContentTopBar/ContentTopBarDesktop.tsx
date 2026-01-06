import { ICONS } from "@/shared/config/icons";

import { Icon } from "../../ui";
import { TabPanelDesktop } from "../TabPanel";

import styles from "./ContentTopBarDesktop.module.css";

interface ContentTopBarDesktopProps {
  onClick: () => void;
}

export function ContentTopBarDesktop({ onClick }: ContentTopBarDesktopProps) {
  return (
    <div className={styles.container}>
      <TabPanelDesktop />
      <button onClick={onClick} className={styles.sortButton}>
        <Icon as={ICONS.sort} size="24px" inheritColor />
      </button>
    </div>
  );
}
