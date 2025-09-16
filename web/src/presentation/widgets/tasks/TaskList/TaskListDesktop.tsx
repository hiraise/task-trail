import clsx from "clsx";

import styles from "./TaskListDesktop.module.css";

import { Icon } from "@/presentation/ui/Icon";
import { Task } from "@/domain/task/task.entity";
import { ICONS } from "@/infrastructure/config/icons";

interface TaskListProps {
  tasks: Task[];
}

export function TaskListDesktop({ tasks }: TaskListProps) {
  return (
    <div className={styles.container}>
      {tasks.map((t) => (
        <TaskItemDesktop key={t.id} task={t} />
      ))}
    </div>
  );
}

function TaskItemDesktop({ task }: { task: Task }) {
  //TODO: replace with user avatar
  //TODO: add project id preffix
  return (
    <div className={styles.taskItemWrapper}>
      <div className={styles.title}>
        <span className={clsx(styles.taskId, "caption-med")}>{"ID-" + task.id}</span>
        <span className="body-med">{task.title}</span>
      </div>
      <div className={styles.iconWrapper}>
        <Icon as={ICONS.profile} size="18px" />
      </div>
    </div>
  );
}
