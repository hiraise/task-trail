import Image from "next/image";

import styles from "./TaskItem.module.css";

import { getUserInitials } from "@/shared/utils/formatters";
import { Task } from "@/domain/task/task.entity";
import { useGetAssignee } from "@/application/tasks/hooks/useGetAssignee";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { data: assignee } = useGetAssignee(task.assigneeId);

  const displayText = task.assigneeId && assignee?.username && getUserInitials(assignee?.username);

  return (
    <div className={styles.taskWrapper}>
      <span className="body-med">{task.title}</span>
      {task.assigneeId && assignee && (
        <div className={styles.avatarWrapper}>
          {assignee.avatarUrl && <Image src={assignee.avatarUrl} fill alt="User avatar" />}
          {!assignee.avatarUrl && <span className="caption-2-reg">{displayText}</span>}
        </div>
      )}
    </div>
  );
}
