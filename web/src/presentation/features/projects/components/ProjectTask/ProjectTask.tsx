import clsx from "clsx";

import { getUserDisplayName, type User } from "@/domain/models/User";
import { UserAvatar } from "@/presentation/shared";

import styles from "./ProjectTask.module.css";

interface ProjectTaskProps {
  title: string;
  /** Ответственный; нет — пустой кружок */
  assignee?: User;
}

export function ProjectTask({ title, assignee }: ProjectTaskProps) {
  return (
    <div className={styles.container}>
      <span className={clsx("body-reg", styles.title)}>{title}</span>
      <UserAvatar
        variant="small"
        src={assignee?.avatarUrl}
        name={assignee && getUserDisplayName(assignee)}
      />
    </div>
  );
}
