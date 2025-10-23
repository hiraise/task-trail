import clsx from "clsx";

import { Icon } from "@/presentation/ui/Icon";
import styles from "./TaskItem.module.css";
import { Task } from "@/domain/task/task.entity";
import { ICONS } from "@/infrastructure/config/icons";

export default function TaskItem({ task }: { task: Task }) {
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
