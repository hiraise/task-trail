import styles from "./TaskInfo.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";

interface TaskStatusProps {
  status: string;
  onClick: () => void;
}

export function TaskStatus({ status, onClick }: TaskStatusProps) {
  return (
    <button className={styles.statusContainer} onClick={onClick}>
      <span className={styles.statusLabel}>{status}</span>
      <Icon as={ICONS.downArrow} size="15px" />
    </button>
  );
}
