import clsx from "clsx";

import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./TaskItem.module.css";

export default function TaskItem({ task }: { task: TaskResponseDto }) {
  return (
    <div className={styles.taskItem}>
      <div className={styles.taskWrapper}>
        <span className={clsx(styles.title, "multiline")}>{task.title}</span>
        <span className={clsx(styles.description, "multiline")}>{task.description}</span>
      </div>
      <div className={styles.iconWrapper}>
        <Icon as={ICONS.profile} size="18px" />
      </div>
    </div>
  );
}
