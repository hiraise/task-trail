import styles from "./TaskStatus.module.css";

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
    <button className={styles.container} onClick={onClick} disabled={isStatusMising}>
      <span className="caption-med">{status?.name || "Статус неопределен"}</span>
      <Icon as={ICONS.downArrow} size="16px" inheritColor />
    </button>
  );
}
