import clsx from "clsx";

import { Icon } from "@/presentation/ui/Icon";
import styles from "./TaskItem.module.css";
import { Task } from "@/domain/task/task.entity";
import { ICONS } from "@/infrastructure/config/icons";

interface TaskItemProps {
  task: Task;
  onClick: () => void;
}

export default function TaskItem({ task, onClick }: TaskItemProps) {
  return (
    <div className={styles.taskItem} onClick={onClick}>
      <div className={styles.taskWrapper}>
        <span className={clsx(styles.title, styles.multiLine)}>{task.title}</span>
        <span className={clsx(styles.description, styles.multiLine)}>{task.description}</span>
      </div>
      <div className={styles.iconWrapper}>
        <Icon as={ICONS.profile} size="18px" />
      </div>
    </div>
  );
}
