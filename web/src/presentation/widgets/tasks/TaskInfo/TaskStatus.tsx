import styles from "./TaskInfo.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface TaskStatusProps {
  status: string;
}

export function TaskStatus({ status }: TaskStatusProps) {
  const handleSelect = () => {
    // TODO: Implement the logic for modal sheet
    console.log("Status button clicked");
  };
  return (
    <button className={styles.statusContainer} onClick={handleSelect}>
      <span className={styles.statusLabel}>{status}</span>
      <Icon as={ICONS.downArrow} size="15px" />
    </button>
  );
}
