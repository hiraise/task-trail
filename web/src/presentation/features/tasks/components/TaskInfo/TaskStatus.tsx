import type { TaskStatusResponseDto } from "@/application/dto/TaskStatusResponseDto";
import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./TaskStatus.module.css";

interface TaskStatusProps {
  status?: TaskStatusResponseDto;
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
