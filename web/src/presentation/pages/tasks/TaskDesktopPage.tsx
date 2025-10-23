"use client";

import clsx from "clsx";
import styles from "./TaskDesktopPage.module.css";

import { BackButton } from "@/presentation/ui/BackButton";
import { tasksTexts } from "@/shared/locales/tasks";
import CommentInput from "@/presentation/widgets/tasks/Comments/CommentInput";
import CommentsList from "@/presentation/widgets/tasks/Comments/CommentsList";
import { TaskInfoDesktop } from "@/presentation/widgets/tasks/TaskInfo";
import { useGetTask } from "@/application/tasks/hooks/useTasks";

export function TaskDesktopPage() {
  const { data: task } = useGetTask();

  if (!task) return null;

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
