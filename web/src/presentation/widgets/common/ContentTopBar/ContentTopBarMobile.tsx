import styles from "./ContentTopBarMobile.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";
import { TabPanelMobile } from "../../tasks/TabPanel/TabPanelMobile";

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
