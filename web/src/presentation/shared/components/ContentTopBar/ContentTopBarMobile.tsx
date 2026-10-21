import { ICONS } from "@/shared/config/icons";

import { Icon } from "../../ui";
import { TabPanelMobile } from "../TabPanel/TabPanelMobile";

import styles from "./ContentTopBarMobile.module.css";

interface ContentTopBarMobileProps {
  onClick: () => void;
}

export function ContentTopBarMobile({ onClick }: ContentTopBarMobileProps) {
  return (
    <div className={styles.container}>
      <TabPanelMobile />
      <button onClick={onClick} className={styles.sortButton}>
        <Icon as={ICONS.sort} size="24px" inheritColor />
      </button>
    </div>
  );
}
