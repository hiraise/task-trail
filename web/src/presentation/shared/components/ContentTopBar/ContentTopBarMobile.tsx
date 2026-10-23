import { ICONS } from "@/shared/config/icons";

import { Icon } from "../../ui";
import { TabPanel } from "../TabPanel";

import styles from "./ContentTopBarMobile.module.css";

interface ContentTopBarMobileProps {
  onClick: () => void;
}

export function ContentTopBarMobile({ onClick }: ContentTopBarMobileProps) {
  return (
    <div className={styles.container}>
      <TabPanel />
      <button onClick={onClick} className={styles.sortButton}>
        <Icon as={ICONS.sort} size="24px" inheritColor />
      </button>
    </div>
  );
}
