"use client";

import clsx from "clsx";
import { useParams } from "next/navigation";

import type { TaskId } from "@/domain/types";
import { BackButton } from "@/presentation/shared";
import { tasksTexts } from "@/shared/locales/tasks";

import { CommentInput, CommentsList, TaskInfoDesktop } from "../../components";
import { useGetTask } from "../../hooks";

import styles from "./TaskDesktopPage.module.css";

export function TaskDesktopPage() {
  const params = useParams();
  const { data: task } = useGetTask(params.taskId as TaskId);

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
