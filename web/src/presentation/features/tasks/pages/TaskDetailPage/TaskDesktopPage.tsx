import clsx from "clsx";

import type { Task } from "@/domain/models/Task";
import { BackButton } from "@/presentation/shared";
import { tasksTexts } from "@/shared/locales/tasks";

import { CommentInput, CommentsList, TaskInfoDesktop } from "../../components";

import styles from "./TaskDesktopPage.module.css";

export function TaskDesktopPage({ task }: { task: Task }) {
  return (
    <div className={styles.container}>
      <BackButton />
      <div className={styles.contentWrapper}>
        <div className={clsx(styles.content, styles.taskInfo)}>
          <TaskInfoDesktop task={task} />
        </div>
        <div className={clsx(styles.content, styles.comments)}>
          <span className={styles.title}>{tasksTexts.comments.title}</span>
          <CommentInput />
          <CommentsList />
        </div>
      </div>
    </div>
  );
}
