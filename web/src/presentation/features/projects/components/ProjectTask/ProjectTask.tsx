import clsx from "clsx";

import { getUserDisplayName, type User } from "@/domain/models/User";
import { UserAvatar } from "@/presentation/shared";

import styles from "./ProjectTask.module.css";

interface ProjectTaskProps {
  /** Task key, like DS-12 — the caption above the name */
  taskKey: string;
  title: string;
  /** Assignee; none — an empty circle */
  assignee?: User;
}

export function ProjectTask({ taskKey, title, assignee }: ProjectTaskProps) {
  return (
    <div className={styles.container}>
      <span className={styles.text}>
        <span className={clsx("caption-reg", styles.key)}>{taskKey}</span>
        <span className={clsx("body-reg", styles.title)}>{title}</span>
      </span>
      <UserAvatar
        variant="small"
        src={assignee?.avatarUrl}
        name={assignee && getUserDisplayName(assignee)}
      />
    </div>
  );
}
