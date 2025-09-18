import styles from "./TaskListTopBarDesktop.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { TabPanel } from "../TabPanel";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

export function TaskListTopBarDesktop() {
  const { showSortOptions } = useGlobalModals();

  // TODO: Implement sorting logic
  const handleSort = async () => {
    const option = await showSortOptions();
    console.log("Selected sort option:", option);
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
