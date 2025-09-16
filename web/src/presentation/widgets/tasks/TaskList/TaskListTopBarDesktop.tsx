import styles from "./TaskListTopBarDesktop.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { TabPanel } from "../TabPanel";

export function TaskListTopBarDesktop() {
  const handleSort = () => {
    console.log("Sort items");
  };

  return (
    <div className={styles.container}>
      <TabPanel />
      <button onClick={handleSort} className={styles.sortButton}>
        <Icon as={ICONS.sort} size="24px" inheritColor />
      </button>
    </div>
  );
}
