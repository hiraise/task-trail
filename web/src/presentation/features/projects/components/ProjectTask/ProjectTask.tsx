import clsx from "clsx";

import type { Task } from "@/domain/models/Task";
import { getUserDisplayName, type User } from "@/domain/models/User";
import { ArchiveTag, HighlightedText, TaskMeta, UserAvatar } from "@/presentation/shared";

import styles from "./ProjectTask.module.css";

interface ProjectTaskProps {
  /** Task key, like DS-12 — the caption above the name */
  taskKey: string;
  title: string;
  /** Assignee; none — an empty circle */
  assignee?: User;
  /** A search query to highlight in the title (ADR-0030) */
  highlight?: string;
  /** The archive tag above the key (ADR-0027) */
  archived?: boolean;
  /** The task whose badges go under the name (TaskMeta) */
  task?: Task;
}

export function ProjectTask({ taskKey, title, assignee, highlight, archived, task }: ProjectTaskProps) {
  return (
    <div className={styles.container}>
      <span className={styles.text}>
        {archived && <ArchiveTag />}
        <span className={clsx("caption-reg", styles.key)}>{taskKey}</span>
        <span className={clsx("body-reg", styles.title)}>
          <HighlightedText text={title} highlight={highlight} />
        </span>
        {task && <TaskMeta task={task} />}
      </span>
      <UserAvatar
        variant="small"
        src={assignee?.avatarUrl}
        name={assignee && getUserDisplayName(assignee)}
      />
    </div>
  );
}
