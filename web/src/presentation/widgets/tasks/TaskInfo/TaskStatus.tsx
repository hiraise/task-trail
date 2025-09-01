import styles from "./TaskInfo.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { type TaskStatus as Status } from "@/domain/task/task.entity";

interface TaskStatusProps {
  status?: Status;
  onClick: () => void;
}

export function TaskStatus({ status, onClick }: TaskStatusProps) {
  const isStatusMising = !status;
  return (
    <button className={styles.statusContainer} onClick={onClick} disabled={isStatusMising}>
      <span className={styles.statusLabel}>{status?.name || "Статус неопределен"}</span>
      <Icon as={ICONS.downArrow} size="15px" />
    </button>
  );
}
